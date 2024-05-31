const availform = require("../model/availform")

const services = (req,res)=> {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("services", {user: req.cookies.signUpAs,profileImage:""})}
const architect = (req,res)=> {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("architect", {user: req.cookies.signUpAs,profileImage:""})}
    
const babySitter = (req,res)=> {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("baby-sitter" , {user: req.cookies.signUpAs,profileImage:""})}
const chef = (req,res)=> {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("chef" , {user: req.cookies.signUpAs,profileImage:""})}
const eventPlanner = (req,res)=> {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("event-planner" , {user: req.cookies.signUpAs,profileImage:""})}
const gym = (req,res) => {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("gym" , {user: req.cookies.signUpAs,profileImage:""})}
const maid = (req,res) => {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("maid" , {user: req.cookies.signUpAs,profileImage:""})}
const makeUp = (req,res) => {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("makeup" , {user: req.cookies.signUpAs,profileImage:""})}
const tutor= (req,res) => {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("tutor" , {user: req.cookies.signUpAs,profileImage:""})}
const healthcare = (req,res) => {
    if(req.cookies.signUpAs === undefined) {
        req.cookies.signUpAs = "Visitor";
    }
    res.render("healthcare", {user: req.cookies.signUpAs,profileImage:""})}

const availFormAction = async (req, res) => {
    const {serviceType, location, estimatedBudget, serviceDate, serviceTime} = req.body;
    console.log (req.body);
    const addDetail = new availform({
        serviceType: serviceType,
        location: location,
        estimatedBudget: estimatedBudget,
        serviceDate: serviceDate,
        serviceTime: serviceTime
    });
    try {
        await addDetail.save();
        console.log('Request successfully Recieved!');
    } catch (error) {
        console.error('Error in availing that service: ', error);
    }
}
module.exports = {services, architect, babySitter, chef, eventPlanner, gym, maid, makeUp, tutor, availFormAction, healthcare}