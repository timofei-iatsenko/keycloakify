#!/usr/bin/env node

import { termost } from "termost";
import { readThisNpmPackageVersion } from "./tools/readThisNpmPackageVersion";
import * as child_process from "child_process";
import { assertNoPnpmDlx } from "./tools/assertNoPnpmDlx";
import { getBuildContext } from "./shared/buildContext";
import { SemVer } from "./tools/SemVer";
import { assert, is } from "tsafe/assert";
import chalk from "chalk";

type CliCommandOptions = {
    projectDirPath: string | undefined;
};

assertNoPnpmDlx();

const program = termost<CliCommandOptions>(
    {
        name: "keycloakify",
        description: "Keycloakify CLI",
        version: readThisNpmPackageVersion()
    },
    {
        onException: error => {
            console.error(error);
            process.exit(1);
        }
    }
);

const optionsKeys: string[] = [];

program.option({
    key: "projectDirPath",
    name: (() => {
        const long = "project";
        const short = "p";

        optionsKeys.push(long, short);

        return { long, short };
    })(),
    description: [
        `For monorepos, path to the keycloakify project.`,
        "Example: `npx keycloakify build --project packages/keycloak-theme`",
        "https://docs.keycloakify.dev/build-options#project-or-p-cli-option"
    ].join(" "),
    defaultValue: undefined
});

function skip(_context: any, argv: { options: Record<string, unknown> }) {
    const unrecognizedOptionKey = Object.keys(argv.options).find(
        key => !optionsKeys.includes(key)
    );

    if (unrecognizedOptionKey !== undefined) {
        console.error(
            `keycloakify: Unrecognized option: ${
                unrecognizedOptionKey.length === 1 ? "-" : "--"
            }${unrecognizedOptionKey}`
        );
        process.exit(1);
    }

    return false;
}

program
    .command({
        name: "build",
        description: "Build the theme (default subcommand)."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./keycloakify");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command<{
        port: number | undefined;
        keycloakVersion: string | number | undefined;
        realmJsonFilePath: string | undefined;
    }>({
        name: "start-keycloak",
        description:
            "Spin up a pre configured Docker image of Keycloak to test your theme."
    })
    .option({
        key: "port",
        name: (() => {
            const name = "port";

            optionsKeys.push(name);

            return name;
        })(),
        description: ["Keycloak server port.", "Example `--port 8085`"].join(" "),
        defaultValue: undefined
    })
    .option({
        key: "keycloakVersion",
        name: (() => {
            const name = "keycloak-version";

            optionsKeys.push(name);

            return name;
        })(),
        description: [
            "Use a specific version of Keycloak.",
            "Example `--keycloak-version 21.1.1`"
        ].join(" "),
        defaultValue: undefined
    })
    .option({
        key: "realmJsonFilePath",
        name: (() => {
            const name = "import";

            optionsKeys.push(name);

            return name;
        })(),
        defaultValue: undefined,
        description: [
            "Import your own realm configuration file",
            "Example `--import path/to/myrealm-realm.json`"
        ].join(" ")
    })
    .task({
        skip,
        handler: async ({ projectDirPath, keycloakVersion, port, realmJsonFilePath }) => {
            const { command } = await import("./start-keycloak");

            validate_keycloak_version: {
                if (keycloakVersion === undefined) {
                    break validate_keycloak_version;
                }

                const isValidVersion = (() => {
                    if (typeof keycloakVersion === "number") {
                        return false;
                    }

                    try {
                        SemVer.parse(keycloakVersion);
                    } catch {
                        return false;
                    }

                    return;
                })();

                if (isValidVersion) {
                    break validate_keycloak_version;
                }

                console.log(
                    chalk.red(
                        [
                            `Invalid Keycloak version: ${keycloakVersion}`,
                            "It should be a valid semver version example: 26.0.4"
                        ].join(" ")
                    )
                );

                process.exit(1);
            }

            assert(is<string | undefined>(keycloakVersion));

            await command({
                buildContext: getBuildContext({ projectDirPath }),
                cliCommandOptions: {
                    keycloakVersion,
                    port,
                    realmJsonFilePath
                }
            });
        }
    });

program
    .command({
        name: "eject-page",
        description: "Eject a Keycloak page."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./eject-page");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "add-story",
        description: "Add *.stories.tsx file for a specific page to in your Storybook."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./add-story");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "initialize-email-theme",
        description: "Initialize an email theme."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./initialize-email-theme");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "initialize-account-theme",
        description: "Initialize the account theme."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./initialize-account-theme");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "copy-keycloak-resources-to-public",
        description:
            "(Webpack/Create-React-App only) Copy Keycloak default theme resources to the public directory."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./copy-keycloak-resources-to-public");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "update-kc-gen",
        description:
            "(Webpack/Create-React-App only) Create/update the kc.gen.ts file in your project."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./update-kc-gen");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command({
        name: "postinstall",
        description: "Initialize all the Keycloakify UI modules installed in the project."
    })
    .task({
        skip,
        handler: async ({ projectDirPath }) => {
            const { command } = await import("./postinstall");

            await command({ buildContext: getBuildContext({ projectDirPath }) });
        }
    });

program
    .command<{
        file: string;
    }>({
        name: "eject-file",
        description: [
            "WARNING: Not usable yet, will be used for future features",
            "Take ownership over a given file"
        ].join(" ")
    })
    .option({
        key: "file",
        name: (() => {
            const name = "file";

            optionsKeys.push(name);

            return name;
        })(),
        description: [
            "Relative path of the file relative to the directory of your keycloak theme source",
            "Example `--file src/login/page/Login.tsx`"
        ].join(" ")
    })
    .task({
        skip,
        handler: async ({ projectDirPath, file }) => {
            const { command } = await import("./eject-file");

            await command({
                buildContext: getBuildContext({ projectDirPath }),
                cliCommandOptions: { file }
            });
        }
    });

// Fallback to build command if no command is provided
{
    const [, , ...rest] = process.argv;

    if (
        rest.length === 0 ||
        (rest[0].startsWith("-") && rest[0] !== "--help" && rest[0] !== "-h")
    ) {
        const { status } = child_process.spawnSync(
            "npx",
            ["keycloakify", "build", ...rest],
            {
                stdio: "inherit"
            }
        );

        process.exit(status ?? 1);
    }
}
