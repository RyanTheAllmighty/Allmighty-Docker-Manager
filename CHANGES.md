# Changes
This file marks the changes in each version of ADM starting with 0.2.0.

## 0.4
### 0.4.0
### Additions
- Show the name of the component and the version when printing out success/error messages to the console while building.
- Add in the --versions option to the build command to list all of a components available versions as per the adm-util.js script if available for that component.
#### Fixes
- Fix build command not working.

## 0.3
### 0.3.0
### Additions
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