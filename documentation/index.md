# Apollon

## Mainly a template

This project is a template. You can add and change folders and files as you seem fit. **Let's explain the out of the box structure.**

### The /config directory

This folder is meant to contain all the json or js files used as configuration ressources. The project comes with two existing config files the ```cors.json``` file and the ```general.json```. The first one configures CORS and is passed to the **cors node module**. The second is used in the template in the two following use cases.
  1. To change the api endpoint url
  2. As a configuration file passed into different scopes with the context object
> The context object is an object passed to the resolvers containing the references to most of the global objects (like the connectors). For more informaton please take a look at the resolver documentation file in this directory

### The /src folder

This contains all the code powering Apollon and should only be changed if you know what you are doing. If changes are made that seem to improve apollon please contribute to the project.

### /schema folder

This folder contains the GraphQl schema seperated into multiple files. Please refer to the graphql documentation for the content of the schema. 
  
### The /resolvers folder

This folder contains all the resolvers. Please refer to the resolver documentation contained in this folder.

### The /connectors folder

A connector is a source of data and is stored in the context objects connectors object under a key matching the filename.
```
context.connectors[filename]

/* Example */
context.connectors.mysql
```
 Whatever is returned by the asynchronous function exported in each connector file will be considered as the actual connector:
 ```
 const mysql = require("mysql");

 module.exports = async function(){
     let options = {
         server: "127.0.0.1",
         user: "root",
         password: "qwerty"
     };

     return await mysql.connect(options);
 }
 ```

 ### The /types folder

 In this file you will find implementation of different types needed in the schema

 ### The /directivers folder

 In this file you will find implementation of different directives needed in the schema

 ### The /other folder 

 This folder is meant for specific files and avoids leaving at the root of the project
