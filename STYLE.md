# Style Guide
This is a simple style guide of how I style and present my code (at least try to).

# Coding Standards
+ All line lengths must be kept less than 200 characters and use 4 spaces rather than tab characters.
+ All JSON documents should use 4 space indentation.
+ Don't do large code commits. My preference is a single commit for a single fix/addition rather than bundled up commits.
+ Document appropriately. While there is no need to put single line comments in for everything, having doc blocks and comments where necessary helps others see what the code does.

# Classes
Since this application is using ECMAScript 6, we have access to classes.

Classes should always use Symbols to hide the original data so it cannot be accessed with appropriate getters and setters.

Immediately in the body of the class should be the constructor followed by any getter/setter methods (using the get/set keyword) and then followed by any other methods of the class.

Lastly any callbacks used internally by the class should be referenced at the bottom of the file (outside of the class) for JSDoc purposes.

# Styling Guidelines
For details on JSDoc used for all JavaScript files, see [this website](http://usejsdoc.org/).

+ Make sure all doc block information has a period at the end.
+ Make sure all doc block @ elements don't have a period at the end.
+ Make sure all comments not in doc blocks end in a period.
+ Make sure there is a blank line between any main doc block information and any @elements.
+ Make sure all callbacks are documented at the very bottom of the file.

## Example
    // Some comment. Which ends in a period.

    /**
     * Where the magic happens. Notice I end in a period.
     *
     * @param {String} arguments - All the arguments passed in from the command line, notice I don't end in a period
     */