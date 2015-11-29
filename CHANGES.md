# Changes
This file marks the changes in each version of ADM starting with 0.2.0.

## 0.2

### 0.2.0
#### Additions
- Added in the ability to specify --version when building components. This value is used as the tag name for the resulting image and is also sent to the Docker build process and is available to use
in the Dockerfile using the 'ARG VERSION' syntax.
#### Fixes
- Fixes issue with the build command building the same component twice if specified `adm build c1 c1`.