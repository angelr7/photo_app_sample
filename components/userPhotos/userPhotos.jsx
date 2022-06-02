import React, {useState} from 'react';
import {
  Typography, Box, TextField, Button
} from '@material-ui/core';
import './userPhotos.css';
import { Link, Redirect } from 'react-router-dom';
// import { CodeSharp } from '@material-ui/icons';
// import fetchModel from "../../lib/fetchModelData";
import axios from "axios";

const months = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

const setImageInfo = (setMin) => {
  return ({target:img}) => {
    let {offsetWidth, offsetHeight} = img;
    let adjWidth = offsetWidth > offsetHeight;
    let attr = `${adjWidth? "minWidth" : "minHeight"}`;
    let obj = {};
    obj.attr = attr;
    setMin(obj);
  };
};

const getPhotoDate = (photo, isComment=false) => {
  let dateInfo = photo.date_time.split('T');
  const date = dateInfo[0].split('-');

  let time = dateInfo[1].split('.')[0];
  time = time.split(':');

  let hour = parseInt(time[0], 10);
  let suffix;
  if (hour < 12) {
    suffix = "AM";
    hour = `${hour === 0? 12 : hour}`;
  } else {
    suffix = "PM";
    hour = `${hour === 12? hour : hour - 12}`;
  }
  return (
    <Box display="flex" flexDirection="column" padding="1%">
    {
      isComment? (
        <Typography variant="caption" color="textPrimary">
          {`${months[parseInt(date[1], 10) - 1]} ${date[2]}, ${date[0]}`}
        </Typography> 
      ) : (
        <Typography variant="h5" color="textPrimary" align="center">
          {`${months[parseInt(date[1], 10) - 1]} ${date[2]}, ${date[0]}`}
        </Typography>
      )
    }
    {
      isComment? (
        <Typography variant="caption" color="textPrimary">
          {`${hour}:${time[1]} ${suffix}`}
        </Typography> 
      ) : (
        <Typography align="center">
          {`${hour}:${time[1]} ${suffix}`}
        </Typography>
      )
    }
    </Box>
  );
};

const submitComment = (comment, photo) => {
  if (comment === "") return;
  axios.post(`/commentsOfPhoto/${photo._id}`, {
    photo_id: photo._id, 
    comment
  }).then(response => {
    axios.post("/activities/new", {
      first_name: "",
      last_name: "",
      filename: photo.file_name,
      activity: "added a comment!"
    }).then(response2 => {
      if (response2) console.log("Activity added successfully!");
    }).catch(error => {
      if (error) console.log("There was an error adding the activity. " + error);
    });
    if (response.data === "Comment Successful") {
      console.log("comment added!");
    }
  }).catch(e => console.log(e));
};

const isInFavorites = (favorites, photo_id) => {
  for (const obj of favorites) {
    if (obj.photo_id === photo_id) return true;
  }
  return false;
};

const renderPhotos = (favorites, photos, user, setPhotos) => {
  const user_id = user._id;
  let itemNo = -1;
  return photos.map(photo => (
      <Box 
        key={++itemNo} 
        position="relative"
        display="flex"
        alignItems="center"
      >
        <Image 
          picture={photo} 
          user={user_id} 
          setPhotos={setPhotos} 
          inFavorites={isInFavorites(favorites, photo._id)}
        />
        <Box 
          width="60%"
          maxHeight="25vw"
          style={{overflowX: "hidden", overflowY: "auto"}}
        >
          <CommentBox picture={photo} />
        </Box>
      </Box>
  ));
};

function EmptyComment() {
  return  (
    <Box 
      padding="2.5%"
      my="1%" 
      display="flex" 
      flexDirection="column"
      position="relative"
      width="80%"
      alignItems="center"
      border="2.5px solid #000"
      borderRadius="1%"
      bgcolor={"#fff"}
      justifyContent="center"
    >
      <Typography variant="h5" align="center">
        No comments here!
      </Typography>
      <Typography variant="caption" align="center">
        Click on the image to add a comment!
      </Typography>
    </Box>
  );
}

function CommentBox(props) {
  const {picture} = props;
  let key = -1;
  return (
    <Box 
      mx="10%"
      position="relative"
      width="100%"
      height="75%"
      display="flex"
      flexDirection="column"
    >
    {
      picture.comments.length === 0? 
      <EmptyComment /> :
      picture.comments.map(comment => {
        const user = comment.user;
        return (
          <Box 
            padding="2.5%"
            my="1%" 
            key={++key} 
            display="flex" 
            position="relative"
            width="80%"
            alignItems="center"
            border="2.5px solid #000"
            borderRadius="1"
            bgcolor={"#fff"}
          >
            <Box width="max-content">
              <Link 
                to={`/users/${user._id}`} 
                style={{
                  height: "min-content",
                  textDecoration: "none",
                }} 
              >
                <Typography 
                  variant="h6" 
                  color="textPrimary"
                >
                  {`${user.first_name} ${user.last_name}`}
                </Typography>
              </Link>
            {
              getPhotoDate(comment, true)
            }
            </Box>
            <Box width="70%" marginX="auto">
              <Typography variant="body1" align="center">
                {`${comment.comment}`}
              </Typography>
            </Box>
          </Box>
        );
      })
    }
    </Box>
  );
}

function CommentOverlay(props) {
  let [comment, setComment] = useState("");
  return (
    <Box 
      position="absolute" 
      width="inherit" 
      height="inherit" 
      borderRadius="inherit"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Typography 
        variant="h5" 
        color="inherit"
        style={{marginTop: "5%"}}
      >
        New Comment
      </Typography>
      <TextField 
        type="text"
        margin="normal"
        autoComplete="off"
        variant="outlined"
        onChange={(event) => {
          setComment(event.target.value);
        }}
        required
        multiline
      />
      <Box
        position="absolute"
        bottom="5%"
        display="flex"
        width="50%"
        justifyContent="space-between"
      >
        <Button 
          type="button" 
          variant="contained"
          onClick={() => {
            submitComment(
              comment, 
              props.photo, 
              props.updateView, 
              props.updateCursor
            );
            props.updateView("info");
            axios.get(`/photosOfUser/${props.user}`).then(response2 => {
              props.setPhotos(renderPhotos(response2.data, props.user, props.setPhotos));
            }).catch(e => {console.log(e);});
          }}
        > 
          Submit
        </Button>
        <Button 
          type="button" 
          variant="contained"
          onClick={() => {
            props.updateView("info");
            props.updateCursor("pointer");
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

function ImageOverlay(props) {
  let [opacity, setOpacity] = useState(0);
  let [cursor, setCursor] = useState("default");
  let [view, setView] = useState("info");
  let [inFavorites, setInFavorites] = useState(props.inFavorites);
  return (
    <Box 
      position="absolute"
      left={0} right={0}
      top={0} bottom={0}
      bgcolor="primary.light"
      width="100%"
      height="100%"
      borderRadius="inherit"
      display="flex"
      justifyContent="center"
      alignItems="center"
      style={{
        transition: "0.5s ease",
        cursor, 
        opacity
      }}
      onMouseEnter={() => {
        if (view === "info") {
          setOpacity(1); 
          setCursor("pointer");
        }
      }}
      onMouseLeave={() => {
        if (view === "info") {
          setOpacity(0);
          setCursor("default");
        }
      }}
      onClick={() => {
        if (view === "info") {
          setView("comment");
          setCursor("default");
        }
      }}
    >
    {
      view === "info"? (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="space-evenly"
          alignItems="center"
          height="90%"
        >
          {getPhotoDate(props.photo)}
          <Button 
            type="button" 
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              if (!inFavorites) {
                axios.post("/favorites/new", {
                  file_name: props.photo.file_name,
                  photo_id: props.photo._id,
                  photo_date: props.photo.date_time
                }).then(response => {
                  if (response) {
                    setInFavorites(!inFavorites);
                    console.log("added to favorites!");
                  }
                }).catch(error => {
                  if (error) console.log("could not add to favorites!");
                });
              } else {
                axios.post("/favorites/remove", {photo: props.photo}).then(response => {
                  if (response) {
                    setInFavorites(!inFavorites);
                    console.log("unfavorited successfully!");
                  }
                }).catch(e5 => console.log("An error occurred removing the favorite. " + e5));
              }
            }}
          > 
          {
            inFavorites? (
              "Un-Favorite"
            ) : (
              "Favorite"
            )
          }
          </Button>
        </Box>
      ) : (
        <CommentOverlay 
          photo={props.photo} 
          updateView={() => {setView("info");}} 
          updateCursor={() => {setCursor("pointer");}}  
          user={props.user}
          setPhotos={props.setPhotos}
        />
      )
    }
    </Box>
  );
}

function Image(props) {
  let [min, setMin] = useState({});
  return (
    <Box 
      display="flex"
      py={5}
    >
      <Box 
        minWidth="25vw"
        minHeight="25vw"
        bgcolor="rgba(0, 0, 0, 0.25)"
        position="relative"
        borderRadius="10%"
        marginLeft="5%"
      >
        <img 
          src={`../images/${props.picture.file_name}`} 
          style={{
            ...{
              [min.attr]: "25vw"
            },
            maxHeight: "25vw",
            maxWidth: "25vw",
            position: "absolute",
            top: "0", 
            left: "0", 
            right: "0", 
            bottom: "0",
            margin: "auto"
          }}
          onLoad={setImageInfo(setMin)}            
        />
        <ImageOverlay 
          photo={props.picture} 
          user={props.user} 
          setPhotos={props.setPhotos} 
          inFavorites={props.inFavorites}
        />
      </Box>
    </Box>
  );
}

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: undefined, 
      photo_tmp: undefined,
      photos: undefined,
    };
    this.setPhotos = this.setPhotos.bind(this);
  }

  setPhotos(photos) {
    this.setState({photos: photos});
  }

  componentDidMount() {
    axios.get("/favorites").then(res => {
      axios.get(`/user/${this.props.match.params.userId}`).then(response => {
        this.setState({user: response.data});
        axios.get(`/photosOfUser/${this.state.user._id}`).then(response2 => {
          this.setState({photos: renderPhotos(res.data, response2.data, this.state.user, this.setPhotos)});
          this.props.updater(`${this.state.user.first_name} ${this.state.user.last_name}'s Photos`);
        }).catch(error => {console.log(error);});
      }).catch(error2 => {
        console.log(error2);
        window.location.href = "http://localhost:3000/photo-share.html#/";
      });
    }).catch(e => {
      console.log(e);
      window.location.href = "http://localhost:3000/photo-share.html#/";
    });
  }
  
  componentDidUpdate() {
    let currId = this.props.match.params.userId;
    if (!this.state.user || this.state.photo_tmp !== this.state.photos ||  (this.state.user && currId !== this.state.user._id)) {
      this.setState({photo_tmp: this.state.photos});
      axios.get("/favorites").then(res => {
        axios.get(`/user/${currId}`).then(response => {
          this.setState({user: response.data});
          axios.get(`/photosOfUser/${this.state.user._id}`).then(response2 => {          
            this.setState({photos: renderPhotos(res.data, response2.data, this.state.user, this.setPhotos)});
            this.props.updater(`${this.state.user.first_name} ${this.state.user.last_name}'s Photos`);
          }).catch(error => {console.log(error);});
        }).catch(error2 => {
          console.log(error2);
          window.location.href = "http://localhost:3000/photo-share.html#/";
        });
      }).catch(e => {console.log(e);});
    } 
  }

  render() {
    if (this.props.user === undefined) return <Redirect to="/" />;
    return (
      this.state.photos? (
        <Box>
          <Typography variant="h2" color="inherit" align="center">
              {`${this.state.user.first_name} ${this.state.user.last_name}'s Photos.`}
          </Typography>
          <Box
            bgcolor="primary.main"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            width="90%"
            left={0} right={0} top={0} bottom={0}
            margin="auto"
            marginTop="2.5%"
          >
            {
              this.state.photos
            }
          </Box>
        </Box>
      ) : <div />
    );
  }
}

export default UserPhotos;
