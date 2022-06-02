import React from "react";
import axios from "axios";
import "./loginRegister.css";
import {
    Box,
    Typography,
    TextField,
    Button
}
from "@material-ui/core";

function InputBox(props) {
    let acVal;
    let required = true;
    switch (props.filler) {
        case "Username":
            acVal = props.type;
            break;
        case "Create Username":
            acVal = props.type;
            break;
        case "Password":
            acVal = "current-password";
            break;
        case "Create Password":
            acVal = "new-password";
            break;
        case "Confirm Password":
            acVal = "new-password";
            break;
        case "First Name":
            acVal = "given-name";
            break;
        case "Last Name":
            acVal = "family-name";
            break;
        default:
            // spec indicates that only username, password, first name, 
            // and last name must be unempty.
            acVal = "off";
            required = false;
            break;
    }
    return (
        <TextField
            label={props.filler}
            type={props.type}
            margin="normal"
            autoComplete={acVal}
            onChange={event => {
                props.updater(props.filler, event.target.value);
            }}
            required={required}
        />
    );
}

function LoginScreen(props) {
    return (
        <Box>
            <Box 
                display="flex"
                flexDirection="column"
                alignItems="center"
                margin="10% auto"
            >
                <form id="loginForm" onSubmit={props.handleSubmit}>
                    <InputBox 
                        type="username" 
                        filler="Username"
                        updater={props.updater}  
                    />
                    <InputBox 
                        type="password" 
                        filler="Password"
                        updater={props.updater} 
                    />
                    <Button 
                        type="submit" 
                        variant="contained"
                        style={{margin: "24px auto"}}
                    >
                        Submit
                    </Button>
                </form>
            </Box>
            <Box 
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
            >
                <Typography 
                    variant="subtitle1" 
                    align="center"
                    style={{marginBottom: "1%"}}
                >
                    {"Don't have an account?"}
                </Typography>
                <Button 
                    type="button" 
                    variant="outlined"
                    onClick={props.updateMode}
                >
                    Create Account
                </Button>
            </Box>
        </Box>
    );
}

function RegisterScreen(props) {
    return (
        <Box>
            <Box 
                display="flex"
                flexDirection="column"
                alignItems="center"
                margin="0 auto"
            >
                <form id="loginForm" onSubmit={props.handleSubmit}>
                    <InputBox 
                        type="username" 
                        filler="Create Username"
                        updater={props.updater}  
                    />
                    <InputBox 
                        type="password" 
                        filler="Create Password"
                        updater={props.updater} 
                    />
                    <InputBox 
                        type="password" 
                        filler="Confirm Password"
                        updater={props.updater} 
                    />
                    <InputBox 
                        type="text"
                        filler="First Name"
                        updater={props.updater}
                    />
                    <InputBox 
                        type="text"
                        filler="Last Name"
                        updater={props.updater}
                    />
                    <InputBox 
                        type="text"
                        filler="Location"
                        updater={props.updater}
                    />
                    <InputBox
                        type="text"
                        filler="Description"
                        updater={props.updater}
                    />
                    <InputBox 
                        type="text" 
                        filler="Occupation"
                        updater={props.updater}
                    />
                    <Button 
                        type="submit" 
                        variant="contained"
                        style={{margin: "24px auto"}}
                    >
                        Submit
                    </Button>
                </form>
            </Box>
            <Box 
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
            >
                <Typography 
                    variant="subtitle1" 
                    align="center"
                    style={{marginBottom: "1%"}}
                >
                    {"Already have an account?"}
                </Typography>
                <Button 
                    type="button" 
                    variant="outlined"
                    onClick={props.updateMode}
                >
                    Log In
                </Button>
            </Box>
        </Box>
    );
}

class LoginRegister extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currUser: "", 
            currPass: "", 
            currPassConfirm: "",
            firstName: "",
            lastName: "",
            location: "",
            description: "",
            occupation: "",
            topLabel: "Log In",
            mode: "login"
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.registerAccount = this.registerAccount.bind(this);
        this.updateVals = this.updateVals.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        axios.post("/admin/login", {
            login_name: this.state.currUser,
            password: this.state.currPass
        }).then(response => {
            this.props.updater({user: response.data});
            this.props.updateTopBar();
            axios.post("/activities/new", {
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                filename: "",
                activity: "logged in!",
            }).then(response2 => {
                if (response2) {
                    console.log("Activity logged!");
                }
            }).catch(err => console.log("Error adding activity. " + err));
        }).catch(e => {
            // avoid linting errors by checking error
            if (e) {
                this.setState({
                    topLabel: "Username or Password was Incorrect!"
                });
            }
        });
    }

    registerAccount(event) {
        event.preventDefault();
        
        if (this.state.currPass !== this.state.currPassConfirm) {
            this.setState({topLabel: "Passwords do not match!"});
            return;
        }

        axios.post("/user", {
            login_name: this.state.currUser,
            password: this.state.currPass,
            first_name: this.state.firstName,
            last_name: this.state.lastName,
            location: this.state.location,
            description: this.state.description,
            occupation: this.state.occupation
        }).then(response => {
            axios.post("/admin/login", response.data).then(response2 => {
                this.props.updater({user: response2.data});
                window.location.href = "http://localhost:3000/photo-share.html#/";
                axios.post("/activities/new", {
                    first_name: this.state.firstName, 
                    last_name: this.state.lastName,
                    filename: "",
                    activity: "created an account!"
                }).then(response3 => {
                    if (response3) console.log("Activity added!");
                }).catch(error => {
                    console.log("Error adding activity. " + error);
                });
                this.props.updateTopBar();
            }).catch(err => {
                // avoid linting errors by checking error
                if (err) {
                    this.setState({
                        topLabel: "An error occured with registration. " +
                                  "Please try again!"
                    });
                }
            });
        }).catch(e => {
            if (e) {
                this.setState({
                    topLabel: "Username already exists. Please try again!"
                });
            }
        });
    }

    updateVals(type, value) {
        switch (type) {
            case "Username":
                this.setState({currUser: value});
                break;
            case "Password":
                this.setState({currPass: value});
                break;
            case "Create Username":
                this.setState({currUser: value});
                break;
            case "Create Password":
                this.setState({currPass: value});
                break;
            case "Confirm Password":
                this.setState({currPassConfirm: value});
                break;
            case "First Name":
                this.setState({firstName: value});
                break;
            case "Last Name":
                this.setState({lastName: value});
                break;
            case "Location":
                this.setState({location: value});
                break;
            case "Description":
                this.setState({description: value});
                break;
            case "Occupation":
                this.setState({occupation: value});
                break;
            default: 
                break;
        }
    } 

    render() {
        return (
            <Box paddingTop="2.5%">
                <Typography variant="h3" align="center">
                    {this.state.topLabel}
                </Typography>
            {
                this.state.mode === "login" && (
                    <LoginScreen 
                        handleSubmit={this.handleSubmit}
                        updater={this.updateVals} 
                        updateMode={() => {
                            this.setState({
                                mode: "create", 
                                topLabel: "Create an Account"
                            });
                            this.props.updateTopBar("Create an Account");
                        }}
                    />
                )
            }
            {
                this.state.mode === "create" && (
                    <RegisterScreen 
                        updater={this.updateVals}
                        handleSubmit={this.registerAccount}
                        updateMode={() => {
                            this.setState({
                                mode: "login",
                                topLabel: "Log In"
                            });
                            this.props.updateTopBar();
                        }}
                    />
                )
            }
            </Box>
        );
    }
}

export default LoginRegister;