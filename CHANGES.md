# Changes
This file marks the changes in each version of ADM starting with 0.2.0.

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