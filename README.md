# Sharp CLI

Command line interface that compiling contracts/running tests/executing scripts

## Commands

```
sharp-cli <command>

Commands:
  sharp-cli compile      compile contracts
  sharp-cli test [task]  run test task
  sharp-cli exec [file]  execute a connex script
```

## Config

```
{
    "contracts_directory": "[string] root directory of contracts",
    "build_directory": "[string] directory to save built contract info",
    "contracts": "[Array<string>] relative path(to contracts directory) of contracts to compile",
    "solc": {
        "version": "[string](optional) semver version requirement",
        "evmVersion": "[string](optional) version of the EVM to compile for",
        "libraries": "[object](optional) addresses of the libraries",
        "optimizer": "[object](optional) optimizer settings"
    }
}
```

Sharp CLI relies [solc-js](https://github.com/ethereum/solc-js) for compiling contract sources, supports `evmVersion/libraries/optimizer` from the solidity compiler's standard JSON input, for more detailed info please refer to [JSON Input Description](https://solidity.readthedocs.io/en/v0.5.11/using-the-compiler.html#input-description).


## Guide

There is a project shows a step by step guide of using sharp, see [sharp-example-vip180](https://github.com/libotony/sharp-example-vip180).
