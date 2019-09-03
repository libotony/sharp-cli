# Sharp CLI

Command line interface which helps running sharp tests

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
        "version": "[string] semver version requirement",
    },
    "task": "[string] npm script to run for the test",
    "port": "[number] port of solo node's ap"
}
```
