import React from "react";
import axios from "axios";
import {
    Box, List, Typography, ListItem, Divider, Button
} from '@material-ui/core';
import {Redirect} from "react-router-dom";

const months = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
];

const parseDate = (activityDate) => {
    let dateInfo = activityDate.split('T');
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
    return {
        date: `${months[parseInt(date[1], 10) - 1]} ${date[2]}, ${date[0]}`,
        time: `${hour}:${time[1]} ${suffix}`
    };
};


function Favorite(props) {
    const dateInfo = parseDate(props.info.date_time);
    // props.updateBar("Favorites");
    return (
        <Box display="flex" alignItems="center" justifyContent="space-evenly" width="inherit">
            <img 
                src={`../images/${props.info.file_name}`} 
                alt={`Preview #${props.itemNo}`} 
                style={{
                    maxWidth: "10vw",
                    maxHeight: "10vw",
                }}
            />
            <Box display="flex" flexDirection="column">
                <Typography align="center">
                {
                    `${dateInfo.date}, ${dateInfo.time}`
                }    
                </Typography>
                <Button 
                    type="button" 
                    variant="contained"
                    onClick={() => {
                        axios.post("/favorites/remove", {photo: props.info}).then(response => {
                            if (response) {
                                axios.get("/favorites").then(response2 => {
                                    props.updater(response2.data);
                                }).catch(err => {console.log(err);});
                            }
                        }).catch(e => console.log("An error occurred removing the favorite. " + e));
                    }}
                > 
                    Un-Favorite
                </Button>
            </Box>
        </Box>
    );
}

class Favorites extends React.Component {
    constructor(props) {
        super(props);
        this.state = {favorites: undefined};
        this.updateFavorites = this.updateFavorites.bind(this);
    }

    updateFavorites(favorites) {
        this.setState({favorites});
    }
    
    componentDidMount() {
        axios.get("/favorites").then(response => {
            this.setState({favorites: response.data});
        }).catch(e => {console.log(e);});
        this.props.updater("Favorites");
    }

    render() {
        if (this.props.user === undefined) {
            return <Redirect to="/" />;
        }
        let key = -1;
        return this.state.favorites ? (
            <Box my="10%" width="100%" display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h2" align="center">
                    {`${this.props.user.first_name} ${this.props.user.last_name}'s Favorites`}
                </Typography>
                <List component="nav" style={{marginTop: "10%", width: "75%"}}>
                {
                    this.state.favorites.length > 0? 
                    this.state.favorites.map(favorite => (
                        <Box key={++key} my="15%">
                            <ListItem style={{justifyContent: "space-evenly"}}>
                                <Favorite info={favorite} itemNo={key} updater={this.updateFavorites} updateBar={this.props.updater} />
                            </ListItem>
                            <Divider />
                        </Box>
                    )) : <Typography variant="h4" align="center">No favorites yet!</Typography>
                }    
                </List>
            </Box>
        ) : <div />;
    }
}

export default Favorites;