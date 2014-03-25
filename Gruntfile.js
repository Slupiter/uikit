module.exports = function(grunt) {

    "use strict";

    var fs = require('fs'), pkginfo = grunt.file.readJSON("package.json");

    grunt.initConfig({

        pkg: pkginfo,

        meta: {
            banner: "/*! <%= pkg.title %> <%= pkg.version %> | <%= pkg.homepage %> | (c) 2014 YOOtheme | MIT License */"
        },

        jshint: {
            src: {
                options: {
                    jshintrc: "src/.jshintrc"
                },
                src: ["src/js/*.js"]
            }
        },

        less: (function(){

            var lessconf = {
                "docsmin": {
                    options: { paths: ["docs/less"], cleancss: true },
                    files: { "docs/css/uikit.docs.min.css": ["docs/less/uikit.less"] }
                }
            },

            themes = [];

            //themes

            ["default", "custom"].forEach(function(f){

                if(grunt.option('quick') && f=="custom") return;

                if(fs.existsSync('themes/'+f)) {

                    fs.readdirSync('themes/'+f).forEach(function(t){

                        var themepath = 'themes/'+f+'/'+t,
                            distpath  = f=="default" ? "dist/css" : themepath+"/dist";

                        // Is it a directory?
                        if (fs.lstatSync(themepath).isDirectory() && t!=="blank" && t!=='.git') {

                            var files = {};

                            if(t=="default") {
                                files[distpath+"/uikit.css"] = [themepath+"/uikit.less"];
                            } else {
                                files[distpath+"/uikit."+t+".css"] = [themepath+"/uikit.less"];
                            }

                            lessconf[t] = {
                                "options": { paths: [themepath] },
                                "files": files
                            };

                            var filesmin = {};

                            if(t=="default") {
                                filesmin[distpath+"/uikit.min.css"] = [themepath+"/uikit.less"];
                            } else {
                                filesmin[distpath+"/uikit."+t+".min.css"] = [themepath+"/uikit.less"];
                            }

                            lessconf[t+"min"] = {
                                "options": { paths: [themepath], cleancss: true},
                                "files": filesmin
                            };

                            themes.push({ "path":themepath, "name":t, "dir":f });
                        }
                    });
                }
            });

            //addons

            themes.forEach(function(theme){

                if(fs.existsSync(theme.path+'/uikit-addons.less')) {

                    var name = (theme.dir == 'default' && theme.name == 'default') ? 'uikit.addons' : 'uikit.'+theme.name+'.addons',
                        dest = (theme.dir == 'default') ? 'dist/css/addons' : theme.path+'/dist/addons';

                    lessconf["addons-"+theme.name] = {options: { paths: ['src/less/addons'] }, files: {} };
                    lessconf["addons-"+theme.name].files[dest+"/"+name+".css"] = [theme.path+'/uikit-addons.less'];

                    lessconf["addons-min-"+theme.name] = {options: { paths: ['src/less/addons'], cleancss: true }, files: {} };
                    lessconf["addons-min-"+theme.name].files[dest+"/"+name+".min.css"] = [theme.path+'/uikit-addons.less'];
                }
            });

            return lessconf;
        })(),

        copy: {
            fonts: {
                files: [{ expand: true, cwd: "src/fonts", src: ["*"], dest: "dist/fonts/" }]
            }
        },

        concat: {
            dist: {
                options: {
                    separator: "\n\n"
                },
                src: [
                    "src/js/core.js",
                    "src/js/utility.js",
                    "src/js/touch.js",
                    "src/js/alert.js",
                    "src/js/button.js",
                    "src/js/dropdown.js",
                    "src/js/grid.js",
                    "src/js/modal.js",
                    "src/js/offcanvas.js",
                    "src/js/nav.js",
                    "src/js/tooltip.js",
                    "src/js/switcher.js",
                    "src/js/tab.js",
                    "src/js/scrollspy.js",
                    "src/js/smooth-scroll.js",
                    "src/js/toggle.js",
                ],
                dest: "dist/js/uikit.js"
            }
        },

        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: "<%= meta.banner %>\n"
                },
                files: {
                    src: [ 'dist/css/*.css', 'dist/js/*.js', 'dist/addons/**/*.css', 'dist/addons/**/*.js' ]
                }
            }
        },

        uglify: {
            distmin: {
                options: {
                    //banner: "<%= meta.banner %>\n"
                },
                files: {
                    "dist/js/uikit.min.js": ["dist/js/uikit.js"]
                }
            },
            addonsmin: {
                files: (function(){

                    var files = {};

                    fs.readdirSync('src/js/addons').forEach(function(f){

                        if(f.match(/\.js/)) {

                            var addon = f.replace(".js", "");

                            grunt.file.copy('src/js/addons/'+f, 'dist/js/addons/'+addon+'.js');

                            files['dist/js/addons/'+addon+'.min.js'] = ['src/js/addons/'+f];

                        }
                    });

                    return files;
                })()
            }
        },

        compress: {
            dist: {
                options: {
                    archive: ("dist/uikit-"+pkginfo.version+".zip")
                },
                files: [
                    { expand: true, cwd: "dist/", src: ["css/*", "js/*", "fonts/*", "addons/**/*"], dest: "" }
                ]
            }
        },

        watch: {
            src: {
                files: ["src/**/*.less", "themes/**/*.less","src/js/*.js"],
                tasks: ["build"]
            }
        }

    });

    grunt.registerTask('indexthemes', 'Rebuilding theme index.', function() {

        var themes = [];

        ["default", "custom"].forEach(function(f){

           if(fs.existsSync('themes/'+f)) {

               fs.readdirSync('themes/'+f).forEach(function(t){

                   var themepath = 'themes/'+f+'/'+t;

                   // Is it a directory?
                   if (fs.lstatSync(themepath).isDirectory() && t!=="blank" && t!=='.git') {

                        var theme = {
                            "name"  : t.split("-").join(" ").replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) { return $1.toUpperCase(); }),
                            "url"   : "../"+themepath+"/uikit.less",
                            "config": (fs.existsSync(themepath+"/customizer.json") ? "../"+themepath+"/customizer.json" : "../themes/default/uikit/customizer.json"),
                            "styles": {}
                        };

                        if(fs.existsSync(themepath+'/styles')) {

                            var styles = {};

                            fs.readdirSync(themepath+'/styles').forEach(function(sf){

                                var stylepath = [themepath, 'styles', sf, 'style.less'].join('/');

                                if(fs.existsSync(stylepath)) {
                                    styles[sf] = "../"+themepath+"/styles/"+sf+"/style.less";
                                }
                            });

                            theme.styles = styles;
                        }

                        themes.push(theme);
                   }
               });
           }
       });

       grunt.log.writeln(themes.length+' themes found: ' + themes.map(function(theme){ return theme.name;}).join(", "));

       fs.writeFileSync("themes/themes.json", JSON.stringify(themes, " ", 4));
    });

    grunt.registerTask('sublime', 'Building Sublime Text Package', function() {
        // css core
        var filepath = 'dist/css/uikit.css', cssFiles = [filepath];

        if (!fs.existsSync(filepath)) {
            grunt.log.error("Not found: " + filepath);
            return;
        }

        // css addons
        fs.readdirSync('dist/css/addons').forEach(function(f){

            if (f.match(/\.css$/)) {
                cssFiles.push('dist/css/addons/'+f);
            }
        });

        var cssContent = "";

        for (var i in cssFiles) {
            cssContent += grunt.file.read(cssFiles[i])+' ';
        }

        var classesList = cssContent.match(/\.(uk-[a-z\d\-]+)/g),
            classesSet  = {},
            pystring    = '# copy & paste into sublime plugin code:\n';

        // use object as set (no duplicates)
        classesList.forEach(function(c) {
            c = c.substr(1); // remove leading dot
            classesSet[c] = true;
        });

        // convert set back to list
        classesList = Object.keys(classesSet);

        pystring += 'uikit_classes = ["' + classesList.join('", "') + '"]\n';

        // JS core
        filepath = 'dist/js/uikit.js';

        if (!fs.existsSync(filepath)) {
            grunt.log.error("Not found: " + filepath);
            return;
        }

        var jsFiles = [filepath];

        // JS addons
        fs.readdirSync('dist/js/addons').forEach(function(f){

            if (f.match(/\.js$/)) {
                jsFiles.push('dist/js/addons/'+f);
            }
        });

        var jsContent = "";

        for (var i in jsFiles) {
            jsContent += grunt.file.read(jsFiles[i]) + ' ';
        }

        var dataList = jsContent.match(/data-uk-[a-z\d\-]+/g),
            dataSet  = {};

        dataList.forEach(function(s) { dataSet[s] = true; });
        dataList  = Object.keys(dataSet);
        pystring += 'uikit_data = ["' + dataList.join('", "') + '"]\n';

        grunt.file.write('dist/uikit_completions.py', pystring);
        grunt.log.writeln('Written: dist/uikit_completions.py');
    });

    // Load grunt tasks from NPM packages
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-banner");

    // Register grunt tasks
    grunt.registerTask("build", ["jshint", "indexthemes", "less", "concat", "copy", "uglify", "usebanner"]);
    grunt.registerTask("default", ["build", "compress"]);
};
