Server side:
  - Clavius' Apache mod_proxy rule on http://bioinformatics.bc.edu/clotelab/webservers to Node.js daemon
  - Node.js (http://nodejs.org/, ^0.10.32) uses the Javascript V8 engine (https://code.google.com/p/v8/; EMCA-262, 5th edition)
    - Single instance running with forever (https://www.npmjs.org/package/forever, ^0.11.1) for fault tolerance
  - Core webserver implemented in Express (http://expressjs.com/, ^4.9.5)
    - Express router captures all requests to clotelab/webservers/* and checks for corresponding webserver directory
      - When found, configuration from clotelab/webservers/<requested_webserver>/index.js is loaded and used to handle all subroutes
      - Subrouting for clotelab/webservers/<requested_webserver>/index.js is inherited from a base implementation that supports:
        1) home (/, /home)
        2) server (/server)
        3) info (/info)
        4) contact (/contact)
      - All default subroutes can be overriden in clotelab/webservers/<requested_webserver>/index.js for webserver-specific customization
  - Calls to command-line executables happen through the submission of PBS scripts using tempfiles (node-temp, ^0.8.1) and child_process.exec (http://nodejs.org/api/all.html#all_child_process_exec_command_options_callback)
    - Job submission is non-blocking, websockets are used (http://socket.io/, ^1.1.0) to notify the user of finished jobs without having to refresh the page
  
Client side:
  - HTML is written in Jade (https://www.npmjs.org/package/jade, ^1.7.0) or EJS (https://www.npmjs.org/package/ejs, ^1.0.0) markup syntax, using Consolidate (https://github.com/visionmedia/consolidate.js, ^0.10.0) for appropriate view engine dispatching
  - Other notable client-side frameworks (that shouldn't need much tweaking later on) include Stylus for CSS3, Yahoo's Pure framework for layout, Font Awesome for typographic icons, and Underscore.js (on both server and client-side) for better functional programming support
  
Current layout:
> tre
      1 .
      2 ├── core
      3 │   ├── bin
      4 │   │   └── www
      5 │   ├── public
      6 │   │   ├── images
      7 │   │   ├── javascripts
      8 │   │   │   └── ui.js
      9 │   │   └── stylesheets
     10 │   │       ├── side-menu-old-ie.css
     11 │   │       ├── side-menu.css
     12 │   │       ├── style.css
     13 │   │       └── style.styl
     14 │   ├── routes
     15 │   │   └── index.js
     16 │   ├── utils
     17 │   │   └── repl_plus
     18 │   │       ├── package.json
     19 │   │       └── repl.js
     20 │   ├── views
     21 │   │   ├── error.jade
     22 │   │   ├── index.jade
     23 │   │   └── layout.jade
     24 │   └── app.js
     25 ├── webservers
     26 │   └── rnamutants
     27 │       └── index.js
     26 │   └── hermes
     27 │       └── index.js
     26 │   └── fftbor2d
     27 │       └── index.js
     28 ├── .gitignore
     29 ├── README.txt
     30 ├── npm-debug.log
     31 └── package.json
     32 
     33 12 directories, 18 files