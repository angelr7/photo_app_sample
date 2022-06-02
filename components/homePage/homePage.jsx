import React, {useState} from "react";
import "./homePage.css";
import {
    Box, 
    Typography,
    List,
    ListItem, 
    Divider,
    Button
}
from '@material-ui/core';
import axios from "axios";
import LoginRegister from "../loginRegister/loginRegister";

const months = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
];

const getLatestActivites = (activities, setActivites) => {
    axios.get("/activities").then(response => {
        if (response.data !== activities) {
            setActivites(response.data);
        }
    }).catch(e => {if (e) console.log("an error occurred fetching activities");});
};

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

function Activity(props) {
    const dateInfo = parseDate(props.activity.date_time);
    if (
        props.activity.activity === "uploaded a photo!" || 
        props.activity.activity === "added a comment!"
    ) {
        return (
            <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-evenly"
                width="inherit"
            >
                <img 
                    src={`../images/${props.activity.filename}`} 
                    alt={`Preview #${props.itemNo}`} 
                    style={{
                        maxWidth: "10vw",
                        maxHeight: "10vw",
                    }}
                />
                <Box 
                    display="flex" 
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"    
                >
                    <Typography align="center">
                    {
                        `${props.activity.first_name} ${props.activity.last_name} ` +
                        props.activity.activity
                    }
                    </Typography>
                    <Typography align="center">
                    {
                        `${dateInfo.date}, ${dateInfo.time}`
                    }    
                    </Typography>
                </Box>
            </Box>
        );
    } else {
        return (
            <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-evenly"
                width="inherit"
            >    
                <Box 
                    display="flex" 
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"    
                >
                    <Typography align="center">
                    {
                        `${props.activity.first_name} ${props.activity.last_name} ` +
                        props.activity.activity
                    }
                    </Typography>
                    <Typography align="center">
                    {
                        `${dateInfo.date}, ${dateInfo.time}`
                    }    
                    </Typography>
                </Box>
            </Box>
        );
    }
}

function ActivityFeed(props) {
    let [activities, setActivities] = useState();
    React.useEffect(() => {
        let isCancelled = false;
        axios.get("/activities").then(response => {
            if (response && !isCancelled) {
                getLatestActivites(activities, setActivities);   
            }
        }).catch(e => console.log("an error occurred fetching activities " + e));
        return () => {
          isCancelled = !props.mounted;
        };
    }, []);


    let key = -1;
    return activities? (
        <Box my="10%" width="75%" display="flex" flexDirection="column" alignItems="center">
            <Button 
                type="button" 
                variant="contained"
                onClick={() => {
                    getLatestActivites(activities, setActivities);
                }}
            > 
            Refresh
            </Button>
            <List component="nav">
            {
                activities.map(activity => (
                    <Box key={++key} my="15%">
                        <ListItem>
                            <Activity activity={activity} itemNo={key} />
                        </ListItem>
                        <Divider />
                    </Box>
                ))
            }    
            </List>
        </Box>
    ) : <div />;
}

class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {mounted: false};
    }

    componentDidMount() {
        this.props.updater();
        this.setState({mounted: true});
    }

    componentWillUnmount() {
        this.setState({mounted: false});
    }

    render() {
        return (
            this.props.user !== undefined? (
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    justifyContent="center"
                    alignItems="center"
                >
                    <Typography variant="h3" color="inherit">
                        Activity Feed
                    </Typography>
                    <ActivityFeed mounted={this.state.mounted} />
                </Box> 
            ) : (
                <LoginRegister 
                    updater={this.props.updateLogin} 
                    updateTopBar={this.props.updater}
                /> 
            )
        );
    }
}

export default HomePage;