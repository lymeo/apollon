# Version 1.1.0 changes

## Added unit testing

You will find a new directory at the root of your project called ```/tests``` and a file named ```report.js``` in the root directory ```/other```.

The tests directory enables you to write tests using the jasmine library. Please check out the jasmine documentation for help on how to write great tests with jasmine.

To maintain a clean logging structure we are using a custom jasmine reporter to log all the tests in the same json style as all other logs.

>> Graphql errors also have been changed to respect the json format

