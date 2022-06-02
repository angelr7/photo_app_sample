import React, {useState} from 'react';
import {
  Typography, Box
} from '@material-ui/core';
import './userDetail.css';
// import { StayPrimaryLandscape } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
// import fetchModel from "../../lib/fetchModelData";

const months = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

const getPhotoDate = (photo) => {
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
    <Box display="flex" flexDirection="column">
      <Typography variant="h5" color="textPrimary" align="center">
        {`${months[parseInt(date[1], 10) - 1]} ${date[2]}, ${date[0]}`}
      </Typography>
      <Typography variant="h5" color="textPrimary" align="center">
        {`${hour}:${time[1]} ${suffix}`}
      </Typography>
    </Box>
  );
};

function ImageOverlay(props) {
  let [boxStyle, setBoxStyle] = useState({opacity: 0});
  
  return (
    <Link 
      to={`/photos/${props.userId}`} 
      style={{borderRadius: "inherit"}}
    >
      <Box
        className="preview-image-container"
        bgcolor={"primary.light"}
        color="#fff"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        left={0} right={0} top={0} bottom={0}
        width="100%" height={"100%"}
        borderRadius="inherit"
        style={{
          ...boxStyle,
          transition: "0.5s ease"
        }}
        onMouseEnter={() => setBoxStyle({
          opacity: 0.9,
          cursor: "pointer"
        })}
        onMouseLeave={() => setBoxStyle({
          opacity: 0,
          cursor: "default"
        })}
      >
        <Typography variant="h5" color="inherit">
          Click to view more
        </Typography>
      </Box>
    </Link>
  );
}

function Image(props) {
  return (
    <Box 
      // mx="auto"
      my={2.5}
      width="15vw"
      height="15vw"
      bgcolor="rgba(0, 0, 0, 0.5)"
      position="relative"
      borderRadius={"10%"}
    >
      <img 
        src={`../images/${props.photo.file_name}`} 
        alt={`Preview #${props.itemNo}`} 
        style={{
          maxWidth: "15vw",
          maxHeight: "15vw",
          position: "absolute",
          top: "0",
          bottom: "0",
          left: "0",
          right: "0",
          margin: "auto"
        }}
      />
      <ImageOverlay userId={props.userId} />
    </Box>
  );
}

/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {user: undefined};
  }

  componentDidMount() {
    axios.get(`/user/${this.props.match.params.userId}`).then(response => {
      this.setState({user: response.data});
      axios.get(`/photosOfUser/${this.state.user._id}`).then(response2 => {
        this.setState({photoList: this.getPhotoPreview(response2.data)});
        this.props.updater(`${this.state.user.first_name} ${this.state.user.last_name}'s Profile`);
      }).catch(e => {console.log(e.response);});
    }).catch(e => {
      console.log(e.response);
      window.location.href = "http://localhost:3000/photo-share.html#/";
    });
    axios.get(`/mostRecentPhoto/${this.props.match.params.userId}`).then(response => {
      this.setState({mostRecent: response.data});
    }).catch(e => {console.log(e);});
    axios.get(`/mostCommentedPhoto/${this.props.match.params.userId}`).then(response => {
      this.setState({mostCommented: response.data});
    }).catch(e => {console.log(e);});
  }

  componentDidUpdate() {
    let currUser = this.props.match.params.userId;
    if (!this.state.user || (this.state.user && currUser !== this.state.user._id)) {
      axios.get(`/user/${currUser}`).then(response => {
        this.setState({user: response.data});
        axios.get(`/photosOfUser/${this.state.user._id}`).then(response2 => {
          this.setState({photoList: this.getPhotoPreview(response2.data)});
          this.props.updater(`${this.state.user.first_name} ${this.state.user.last_name}'s Profile`);
        }).catch(e => {console.log(e.response);});
      }).catch(e => {
        console.log(e.response);
        window.location.href = "http://localhost:3000/photo-share.html#/";
      });
      axios.get(`/mostRecentPhoto/${this.props.match.params.userId}`).then(response => {
        this.setState({mostRecent: response.data});
      }).catch(e => {console.log(e);});
      axios.get(`/mostCommentedPhoto/${this.props.match.params.userId}`).then(response => {
        this.setState({mostCommented: response.data});
      }).catch(e => {console.log(e);});
    }
  }

  getPhotoPreview(photos) {
    // get random 3 photos 
    if (photos.length > 3) {
      let numRandom = 3;
      let randomPhotos = [];
      while (numRandom > 0) {
        let random = Math.floor(Math.random() * photos.length);
        if (!randomPhotos.includes(random)) {
          randomPhotos.push(random);
          numRandom--;
        }
      }
      randomPhotos = randomPhotos.map(index => photos[index]);
      photos = randomPhotos;
    }
    
    // format photos as jsx objects
    let counter = 0;
    return photos.map((photo) => {
      return (
        <Image 
          photo={photo}
          key={++counter}
          userId={this.state.user._id}  
        />
      ); 
    });
  }

  render() {
    return (
      this.state.user? (
        <div>
          <Typography variant="h1" color="inherit" align="center">
              {`${this.state.user.first_name} ${this.state.user.last_name}`}
          </Typography>
          <Box my={2.5} />
          <Typography variant="h5" color="inherit" align="center">
            {`Location: ${this.state.user.location}`}
          </Typography>
          <Box my={2.5} />
          <Typography variant="h5" color="inherit" align="center">
            {`Occupation: ${this.state.user.occupation}`}
          </Typography>
          <Box my={2.5} />
          <Typography variant="h5" color="inherit" align="center">
            About Me:
          </Typography>
          <Box my={0.5} />
          <Box mx={2.5}>
            <Typography variant="h5" color="inherit" align="center">
              {this.state.user.description}
            </Typography>
          </Box>
          <Box my={7.5} />
          <Typography variant="h3" color="inherit" align="center">
            Photos Preview
          </Typography>
          <Box 
            bgcolor="primary.main"
            width="90%"
            height="75%"
            margin="auto"
            display="flex"
            justifyContent="space-evenly"
            marginTop={2.5}
          >
          {
            this.state.photoList ?? <div />
          }
          </Box>
          <Box my={7.5} />
          <Typography variant="h3" color="inherit" align="center">
            Most Recent Photo
          </Typography>
          <Box 
            bgcolor="primary.main"
            width="90%"
            height="75%"
            margin="auto"
            display="flex"
            justifyContent="center"
            marginTop={2.5}
          >
          {
            this.state.mostRecent ? (
              <Box width="100%" display="flex" alignItems="center" justifyContent="space-evenly">
                {<Image photo={this.state.mostRecent} userId={this.state.user._id} />}
                {getPhotoDate(this.state.mostRecent)}
              </Box>
            ) : <div />
          }
          </Box>
          <Box my={7.5} />
          <Typography variant="h3" color="inherit" align="center">
            Most Commented Photo
          </Typography>
          <Box 
            bgcolor="primary.main"
            width="90%"
            height="75%"
            margin="auto"
            display="flex"
            justifyContent="center"
            marginTop={2.5}
          >
          {
            this.state.mostCommented ? (
              <Box width="100%" display="flex" alignItems="center" justifyContent="space-evenly">
                {<Image photo={this.state.mostCommented} userId={this.state.user._id} />}
                <Typography variant="h5" color="textPrimary" align="center">
                  {`Comment Count: ${this.state.mostCommented.comments.length}`}
                </Typography>
              </Box>
            ) : <div />
          }
          </Box>
        </div>
      ) : <div />
    );
  }
}

export default UserDetail;
