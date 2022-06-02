import React from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Dialog
} from '@material-ui/core';
import './TopBar.css';
import axios from "axios";
import { Link } from 'react-router-dom';

/**
 * Define TopBar, a React componment of CS142 project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {uploading: false};
    this.handleLogOut = this.handleLogOut.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
  }

  getDescription() {
    let pathInfo = this.props.page.split("/").filter(
      item => item !== ""
    );
    if (pathInfo.length === 1) return pathInfo[0];

    let pageInfo;
    switch (pathInfo[pathInfo.length - 1]) {
      case "photo-share.html#":
        pageInfo = "Home";
        break;
      case "photo-share.html?#":
        pageInfo = "Home";
        break;
      case "users":
        pageInfo = "Users";
        break;
      default: 
        break;
    }
    return pageInfo;
  }

  handleLogOut() {
    axios.post("/activities/new", {
      first_name: this.props.user.first_name,
      last_name: this.props.user.last_name,
      filename: "",
      activity: "logged out!",
    }).then(response2 => {
      if (response2) console.log("Activity logged!");
    }).catch(error => {console.log("An error occurred while adding the activity. " + error);});

    axios.post("/admin/logout").then(response4 => { 
      if (response4.data === "") {
        this.props.removeUser();
        window.location.href = "http://localhost:3000/photo-share.html#/";
      }
    }).catch(e => {
      if (e) {
        console.log(e);
        console.log("An error occurred while logging out. Please try again.");
      }
    });
  }

  handleImageUpload(e) {
    e.preventDefault();
    if (this.uploadInput.files.length > 0) {
      const domForm = new FormData();
      domForm.append("uploadedphoto", this.uploadInput.files[0]);
      axios.post("/photos/new", domForm).then(res => {
        if (res) {
          this.setState({uploading: false});
          axios.get(`/mostRecentPhoto/${this.props.user._id}`).then(response3 => {
            const photo = response3.data;
            axios.post("/activities/new", {
              first_name: this.props.user.first_name, 
              last_name: this.props.user.last_name,
              filename: photo.file_name,
              activity: "uploaded a photo!",
            }).then(response2 => {
              if (response2) {
                console.log("Activity added!");
              }
            }).catch(err => {
              console.log("An error occurred while adding the latest activity. " + err);
            });
          }).catch(error => {
            console.log("an error occurred getting the added image! " + error);
          });
          
          // redirecting in this way allows the user to get the updated image
          // uploads without refreshing or performing any more code than 
          // what is already written for other components
          let loc = window.location.href.split("users/");
          if (loc.length > 1) {
            window.location.href = loc[0] + "photos/" + loc[1];
            return;
          }
          
          loc = window.location.href.split("photos/");
          if (loc.length === 1) return;
          window.location.href = loc[0] + "users/" + loc[1];
        }
      }).catch(err => console.log(`POST ERR ${err}`));
    }
  }

  render() {
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
      {
        this.props.user === undefined? (
          <Toolbar style={{justifyContent: "end"}}>
            <Typography variant="h5" color="inherit">
              {this.getDescription()}
            </Typography>
          </Toolbar>
        ) : (
          <Toolbar>
            <Box display='flex' flexDirection="column" flexGrow={1}>
              <Typography variant="h5" color="inherit">
                {`Hello, ${this.props.user.first_name}!`}
              </Typography>
              <Typography variant="caption" color="inherit">
                {`${this.getDescription()}`}  
              </Typography> 
            </Box>
            <Box 
              display='flex' 
              alignItems="center"
              width="50%"
              justifyContent="space-between"
            >
              <Link to="/favorites" style={{textDecoration: "none"}}>
                <Button 
                  variant="contained"
                  component="label"
                  size="small"
                >
                  View Favorites
                </Button>
              </Link>
              <Link to="/" style={{textDecoration: "none"}}>
                <Button 
                  variant="contained"
                  component="label"
                  size="small"
                >
                  View Activities
                </Button>
              </Link>
              <Button 
                variant="contained"
                component="label"
                size="small"
                onClick={() => {this.setState({uploading: true});}}
              >
                Post Photo
              </Button>
              <Dialog 
                open={this.state.uploading} 
                onClose={() => {this.setState({uploading: false});}}
              >
                <form 
                  onSubmit={this.handleImageUpload} 
                  display="block"
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={(domFileRef) => {this.uploadInput = domFileRef;}}
                  />
                  <Button variant="contained" type="submit">Post</Button>
                </form>
              </Dialog>

              <Button 
                type="button" 
                variant="contained" 
                size="small"
                onClick={this.handleLogOut}
              >
                Log Out
              </Button>
            </Box>
          </Toolbar>
        )
      }
      </AppBar>
    );
  }
}

export default TopBar;
