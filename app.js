const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// process.env.PORT -> if you deploy your app on heroku they will provide a port to our app
// || 3000  -> so that our app listens on 3000 when running locally.
let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));


//now local host address is changed with cluster addess on mongodb Atlas
// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongoDB atlas cluster connect URL");


const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to you todoList"
});
const item2 = new Item({
    name: "+ plus Button to add a element"
});
const item3 = new Item({
    name: "<-- hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name : String,
    itemss : [itemsSchema]
});
const List = mongoose.model("List",listSchema);


app.listen(port, () => {
    console.log("Server Started");
});

app.get("/", function (req, res) {
    //to render a ejs file with name list
    Item.find({}, function (err, foundItems) {

        if (foundItems.length == 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Success");
                }
            });
            res.redirect("/");
        }
        else res.render("list", { listTitle: "Today", listItems: foundItems });
    });
});

app.post("/", function (req, res) {
    let newItem = req.body.task;
    const listName = req.body.list;

    //remove all white spaces
    newItem = newItem.trim();

    //if block to stop process if input is empty or only contains white space
    if(newItem.length == 0){

        if(listName === "Today"){
            res.redirect("/");
        }
        else{
            res.redirect("/"+listName);
        }
        return false;
    }
    const item = new Item({
        name: newItem
    });
    //if default list just add
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        //custom list
        List.findOne({name:listName}, function(err, foundList){
            if(!err){
                foundList.itemss.push(item);
                foundList.save();
                res.redirect("/"+listName);
            }
        })
    }
    
});

app.post("/delete", function(req,res){
    let checkedItemId = req.body.checkbox;
    const listTitle = _.capitalize(req.body.listTitle);
    if(listTitle === "Today"){
        Item.deleteOne({_id:checkedItemId}, function(err){
            if(err){
                console.log(err);
            }
            else{
                // console.log("Success Delete");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name:listTitle},{$pull : {itemss :{_id:checkedItemId}}},function(err, foundList){
            if(!err){
                res.redirect("/"+listTitle);
            }
            else{
                console.log(err);
            }
        });
    }
});

//you can create a new list
app.get("/:id", function(req,res){
    const customListName = _.capitalize(req.params.id);
    List.findOne({name:customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name : customListName,
                    itemss : defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                res.render("list", { listTitle: foundList.name, listItems: foundList.itemss });
            }
        }
    });
});


app.get("/about", (req, res) => {
    res.render("about");
});