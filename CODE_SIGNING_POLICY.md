# Code Signing Policy

## Purpose

Flux Tasks distributes Windows application binaries and installers.

Code signing is used to verify the authenticity and integrity of official releases.

## Official Repository

Source code is publicly available at:

https://github.com/Flux-Tasks/Flux-Tasks

## Open Source License

Flux Tasks is distributed under the MIT License.

## What Is Signed

The following artifacts may be signed:

* Windows installers (.exe)
* Windows release packages
* Future Windows update packages

## Release Process

1. Source code is maintained in the public GitHub repository.
2. Release builds are generated from the repository.
3. Release artifacts are created through the project's build pipeline.
4. Artifacts may be signed before publication.
5. Signed artifacts are published through GitHub Releases.

## Signing Service

Flux Tasks may use SignPath Foundation for code signing.

Free code signing provided by SignPath Foundation.

## Security

Private signing certificates and signing credentials are never stored in the GitHub repository.

Signing operations are performed through secure signing infrastructure.

## Verification

Users should download software only from official project sources:

https://github.com/Flux-Tasks/Flux-Tasks/releases

Users are encouraged to verify digital signatures whenever possible.

## Policy Updates

This policy may be updated as the project's release and signing process evolves.
