import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch
} from 'react-router-dom';
import {
  Grid, Paper, Box
} from '@material-ui/core';
import './styles/main.css';

// import axios from "axios";

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import HomePage from './components/homePage/homePage';
import Favorites from "./components/favorites/favorites";

// import fetchModel from './lib/fetchModelData';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: window.location.href, 
      user: undefined
    };
  }

  updateTopBar = (path=window.location.href) => {
    this.setState({path: path});
  };

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar 
            page={this.state.path} 
            // version={this.state.version} 
            user={this.state.user}
            removeUser={() => {this.setState({user: undefined});}} 
          />
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3} style={{height: "min-content"}}>
          <Paper className="cs142-main-grid-item" style={{height: "min-content"}}>
            <UserList 
              updater={this.updateTopBar} 
              user={this.state.user}
            />
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item" style={{height: "auto"}}>
            <Switch>
              <Route path="/users/:userId"
                render={ 
                  props => (
                    <Box paddingBottom={2.5}>
                      <UserDetail 
                        updater={this.updateTopBar}
                        // user={this.state.user}
                        {...props} 
                      />
                    </Box>
                  )
                } 
              />
              <Route path="/photos/:userId"
                render={ 
                  props => (
                    <UserPhotos 
                      updater={this.updateTopBar}
                      user={this.state.user}
                      {...props} 
                    />
                  )
                }
              />
              <Route path="/users" 
                render={
                  props => (
                    <UserList 
                      updater={this.updateTopBar}
                      user={this.state.user} 
                      {...props} 
                    />
                  )
                }
              />
              <Route path="/favorites" 
                render={
                  props => (
                    <Favorites 
                      updater={this.updateTopBar}
                      user={this.state.user}
                      {...props} 
                    />
                  )
                }
              />
              <Route path="/" 
                render={
                  props => (
                    <HomePage 
                      updater={this.updateTopBar}
                      user={this.state.user}
                      updateLogin={update => {this.setState(update);}}
                      {...props} 
                    />
                  )
                }
              />
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
      </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
