import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography
}
from '@material-ui/core';
import './userList.css';
import { Link } from "react-router-dom";
import axios from "axios";

/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {userList: undefined};
  }

  componentDidMount() {
    axios.get("/user/list").then(response => {
      this.setState({userList: response.data});
    }).catch(error => {console.log(error.response);});
    this.props.updater();
  }

  render() {
    if (this.props.user === undefined) {
      return (
        <Typography variant="subtitle1" color="inherit" align="center">
          Please login to see the list of users!
        </Typography>
      );
    }

    let i = -1;
    return (
      this.state.userList? (
        <Box>
          <List component="nav">
            {
              this.state.userList.map(user => ( 
                <div key={++i}>
                  <ListItem 
                    button 
                    component={Link} 
                    to={`/users/${user._id}`} 
                  >
                    <ListItemText 
                      primary={`${user.first_name} ${user.last_name}`} 
                      align="center"
                    />
                  </ListItem>
                  <Divider />
                </div>  
              ))
            }
          </List>
        </Box>
      ) : <div />
    );
  }
}

export default UserList;