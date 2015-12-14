# Changes
This file marks the changes in each version of ADM starting with 0.2.0.

## 1.2
### 1.2.0
#### Additions
- Add in the `logging.debugLevel` setting to allow setting the level of debug to log ([more information](https://github.com/RyanTheAllmighty/Allmighty-Docker-Manager/wiki/developers#debug-logging)).
- Add in the ability to specify ip addresses when defining ports for a layer.
- Add in the ability to specify the exposed ports for a layer with the `exposedPorts` syntax which takes the same structure as the `ports` section.
- Add in cron stuff so crons can be specified for applications and run with the `cron` command.
#### Changes
- Massively speed up the `up` command.
#### Fixes
- Fix issue with the `up` command still attempting to bring an application up when it's all up already.
- Fix the `run` command not erroring out when attempting to run a non run layer.
#### Removed
- Removed the monitor command since that's not within the scope of the application.

## 1.1
### 1.1.0
#### Additions
- Add in the ability to set a data layer as 'autoMount' which auto mounts it as if it were in the volumesFrom section.
- Added in the environment.json file which will allow you to pass environment variables defined in this file (same format as in the application.json) to all containers.
#### Changes
- When an environment variable that uses the `${e:}` syntax to read from an environment variable doesn't exist, it will simply not include that when running the container.

## 1.0
### 1.0.0
#### Additions
- Add example of the 'runAfter' functionality to the sample folder.
- Add in command line completion for bash/zsh. Read the README for more information.
- Add in the ability to specify if you're working with the Docker Hub for your components and your username on there.
- Allow adding in multiple tags to a build process using --tag one or more times (`adm build component --version 3.2.2 --tag stable --tag 3.2`).
- Add in `--stopped` option to the clean command, in conjunction with the `--containers` option, to remove stopped containers only.
- Added lint command to check the user defined json files to make sure they're valid according to our set schema.
- Added in variables which can be specified in an application.json or a separate variables.json file and can be provided in other parts of the application.json as `${v:varaible}`.
#### Changes
- Move the --storagePath command line argument to set the storage path to the 'ADM_STORAGE_PATH' environment variable.
- The run command will now bring up the necessary containers needed to run and then bring them down and remove them once finished.
- dataOnly layers are now stored within a data object above the layers object in an application.json.
- runOnly layers are now stored within a run object above the layers object in an application.json.
- Variables used in different places (`${directory}`) have been replaced with the new variable syntax (`${d:varaible}`).
- Allow restarting a single layer of an application with the restart command.
- Make the component utility getLatestVersion function pass in the options.
- Make the application utility files pass in the options first.
#### Fixes
- Fix issue with building images that use the 'adm-util.js' file to provide the latest version not getting their required modules.
- Fix list command not working.
- Fix the push and pull commands not showing any output.
- Fix issue with the run command not pulling missing images.
- Restarting an application will actually bring down and remove the containers and spin them up fresh.
- Fix the setup command not creating directories in the directories.json file or for any of the volumes in the layers.
#### Removed
- Removed auto adding of the latest tag. This should be done via the --tag option of the build command.

## 0.7
### 0.7.0
#### Additions
- Add in variable for host volumes on layers for '__adm_application' which points to the folder for the application (where the json is).
- Add in variable parsing for workingDirectory in layers.
- Make NodeJS version 4.2.2 be the minimum required version.
- Add in 'runAfter' to layers which are things to run after a successful completion of a 'runOnly' command.
#### Changes
- Complete the switch to promises.

## 0.6
### 0.6.0
#### Additions
- Add in a directories.json file which stores global directories to use by applications with ${name} without having to redeclare it in every application.
- Add in ability to specify a layers image with the string '${repositoryURL}' which is replaced by the repositories name in the settings.
- Applications now have a 'adm-util.js' file that can be used to run JS before bringing an application up or down.
#### Changes
- Switched callbacks to promises.
- Applications are now stored in their own folders rather than all in the applications folder and are now named application.json.
- When using the 'adm-util.js' files, allow providing an array of modules to require when calling the functions.
- Change the directories for each application to be a full blown class so it's more helpful.
#### Fixes
- Fix issue with the push command trying to push non existent images.

## 0.5
### 0.5.0
#### Additions
- Add in --untagged option to the clean command to only remove untagged images (--images --untagged).
- Add in list command to list all the container names for all or a single application.
#### Fixes
- Fix issue when building multiple components that it wouldn't fetch the latest version.

## 0.4
### 0.4.1
#### Additions
- Add in --force option to the clean command.
- Tag newly built images with the latest tag when building with the latest version.

### 0.4.0
#### Additions
- Show the name of the component and the version when printing out success/error messages to the console while building.
- Add in the --versions option to the build command to list all of a components available versions as per the adm-util.js script if available for that component.
#### Fixes
- Fix build command not working.

## 0.3
### 0.3.0
#### Additions
- Added in the ability to have a util file for components (adm-util.js in the component folder) which has helper methods including 'getLatestVersion' which should return in a promise the version
number to use if one isn't passed in via --version. See README.md for more information.
#### Fixes
- Fix VERSION not actually being passed into the build process.

## 0.2
### 0.2.0
#### Additions
- Added in the ability to specify --version when building components. This value is used as the tag name for the resulting image and is also sent to the Docker build process and is available to use
in the Dockerfile using the 'ARG VERSION' syntax.
#### Fixes
- Fixes issue with the build command building the same component twice if specified `adm build c1 c1`.