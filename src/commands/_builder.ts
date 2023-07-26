import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import ck from 'chalk'
import { build, context, type BuildContext } from 'esbuild'
import { getTsconfig } from 'get-tsconfig'
import { defaultPaths } from '../utils/constants'
import { clearExtension, join } from '../utils/path'
import { existsSync, rmSync } from 'fs'
// import {
//   Project,
//   SyntaxKind,
//   ParameterDeclaration,
//   Block,
//   ArrowFunction,
//   FunctionDeclaration,
//   FunctionExpression,
//   ReturnStatement,
// } from 'ts-morph'

interface StartBuildProps {
  input: string
  output: string
  entry: string
  config?: IntREST.Config
}

// let project: Project

export function startAST() {
  // project = new Project({
  //   compilerOptions: {
  //     incremental: true,
  //   },
  //   tsConfigFilePath: join(process.cwd(), 'tsconfig.json'),
  // })
}

export async function callBuild({
  input,
  output,
  entry,
  config,
}: StartBuildProps) {
  // Generate the output path for the compiled app
  const appPath = join(output, defaultPaths.compiledApp)
  // Generate the absolute path for the entry file
  const absoluteEntry = join(input, entry)

  await build({
    entryPoints: {
      [clearExtension(entry)]: absoluteEntry,
    },
    bundle: true,
    minify: false,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: appPath,
    plugins: [
      // Use the TsconfigPathsPlugin to enable resolution of TypeScript paths
      TsconfigPathsPlugin({
        // The tsconfig import in lib '@esbuild-plugins/tsconfig-paths' is not working
        // so we need to use the get-tsconfig package to get the tsconfig object
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      // Add a custom plugin to log the build status
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(async () => {
            console.info(
              '%s Building - %s',
              ck.yellow('◉'),
              ck.bold.blue(entry),
            )
            // await generateMorphTypes(absoluteEntry)
          })
          build.onEnd(() => {
            console.info('%s Done - %s', ck.green('◉'), ck.bold.blue(entry))
          })
        },
      },
    ],
  })
}

const contextMap = new Map<string, BuildContext>()

export async function startWatchBuild({
  input,
  output,
  entry,
  config,
}: StartBuildProps) {
  // Generate the output path for the compiled app
  const appPath = join(output, defaultPaths.compiledApp)
  // Generate the absolute path for the entry file
  const absoluteEntry = join(input, entry)
  // If the entry file is already being watched, do nothing
  if (contextMap.has(absoluteEntry)) {
    return
  }

  const ctx = await context({
    entryPoints: {
      [clearExtension(entry)]: absoluteEntry,
    },
    bundle: true,
    minify: false,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: appPath,
    logLevel: 'silent',
    plugins: [
      // Use the TsconfigPathsPlugin to enable resolution of TypeScript paths
      TsconfigPathsPlugin({
        // The tsconfig import in lib '@esbuild-plugins/tsconfig-paths' is not working
        // so we need to use the get-tsconfig package to get the tsconfig object
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      // Add a custom plugin to log the build status
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(async () => {
            console.info(
              '%s Building - %s',
              ck.yellow('◉'),
              ck.bold.blue(entry),
            )
            // await generateMorphTypes(absoluteEntry)
          })
          build.onEnd(() => {
            const existsEntry = existsSync(absoluteEntry)
            if (!existsEntry) {
              contextMap.get(absoluteEntry)?.dispose()
            } else {
              console.info('%s Done - %s', ck.green('◉'), ck.bold.blue(entry))
            }
          })
          // Remove the compiled file when the build is disposed
          build.onDispose(async () => {
            const existsApp = existsSync(
              join(appPath, clearExtension(entry) + '.mjs'),
            )
            existsApp && rmSync(join(appPath, clearExtension(entry) + '.mjs'))
            // await removeMorphTypes(absoluteEntry)
            console.info('%s Removed - %s', ck.red('◉'), ck.bold.blue(entry))
          })
        },
      },
    ],
  })
  // Save the context to the map
  contextMap.set(absoluteEntry, ctx)
  // Start the build
  ctx.watch()
}

// async function generateMorphTypes(absolutePath: string) {
//   let source = project.getSourceFile(absolutePath)
//   if (!source) {
//     project.addSourceFileAtPathIfExists(absolutePath)
//     source = project.getSourceFile(absolutePath)
//   } else {
//     source.refreshFromFileSystemSync()
//   }
//   if (!source) {
//     return
//   }

//   source.forEachChild((node) => {
//     if (
//       !(
//         node.isKind(SyntaxKind.FunctionDeclaration) ||
//         node.isKind(SyntaxKind.VariableStatement)
//       ) ||
//       !node.getExportKeyword()
//     ) {
//       return
//     }
//     let name: string = ''
//     let params: ParameterDeclaration[] = []
//     let baseBlock: Block | null = null
//     if (node.isKind(SyntaxKind.FunctionDeclaration)) {
//       name = node.getName() ?? ''
//       params = node.getParameters()
//       const body = node.getBody()!
//       if (body.isKind(SyntaxKind.Block)) {
//         baseBlock = body
//       }
//     } else {
//       const varNode = node
//         .getDeclarationList()
//         .getChildren()
//         .find((child) => child.isKind(SyntaxKind.VariableDeclaration))
//       if (!varNode) return
//       const varChildren = varNode.getChildren()
//       const identifier = varChildren.find((child) =>
//         child.isKind(SyntaxKind.Identifier),
//       )
//       const varFunction = varChildren.find(
//         (child) =>
//           child.isKind(SyntaxKind.ArrowFunction) ||
//           child.isKind(SyntaxKind.FunctionExpression) ||
//           child.isKind(SyntaxKind.FunctionDeclaration),
//       ) as ArrowFunction | FunctionExpression | FunctionDeclaration | undefined
//       if (!varFunction || !identifier) return
//       name = identifier.getText()
//       params = varFunction.getParameters()
//       const body = varFunction.getBody()!
//       if (body.isKind(SyntaxKind.Block)) {
//         baseBlock = body
//       }
//     }

//     const resturnStatements = baseBlock
//       ?.getDescendantStatements()
//       .filter((statement) =>
//         statement.isKind(SyntaxKind.ReturnStatement),
//       ) as ReturnStatement[]

//     resturnStatements?.forEach((statement) => {
//       console.log(statement.toString())
//     })
//   })
// }
// async function removeMorphTypes(absoluteEntry: string) {
//   const source = project.getSourceFile(absoluteEntry)
//   if (source) {
//     project.removeSourceFile(source)
//   }
// }
