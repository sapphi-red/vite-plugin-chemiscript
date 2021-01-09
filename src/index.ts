/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TransformHook } from 'rollup'
import type { Plugin } from 'vite'
import { parse } from '@vue/compiler-sfc'
import { parse as scriptParse } from '@babel/parser'
import type {
  ObjectExpression,
  BlockStatement,
  Statement,
  Expression
} from '@babel/types'
import MagicString from 'magic-string'

export const chemiscript = (): Plugin => {
  const transform: TransformHook = function (code, id) {
    if (!id.endsWith('.vue')) {
      return null
    }
    const { descriptor, errors } = parse(code)
    if (errors.length > 0) {
      return null
    }
    if (!descriptor.script || !descriptor.script.attrs.chemi) {
      return null
    }

    const input = descriptor.script.content

    const s = new MagicString(input)
    const ast = scriptParse(input, {
      sourceType: 'module'
    }).program.body

    let exportObjectNode: ObjectExpression | null = null
    ast.forEach(node => {
      if (node.type !== 'ExportDefaultDeclaration') return
      const decl = node.declaration
      if (decl.type === 'ObjectExpression') {
        exportObjectNode = decl
        return
      }

      if (decl.type === 'CallExpression') {
        if (decl.arguments.length > 0) {
          const arg = decl.arguments[0]
          if (arg?.type === 'ObjectExpression') {
            exportObjectNode = arg
          }
        }
      }
    })

    if (!exportObjectNode) {
      return
    }
    const node = exportObjectNode as ObjectExpression
    let bodyNode: BlockStatement | null = null
    node.properties.forEach(prop => {
      if (prop.type !== 'ObjectMethod') return
      if (prop.key.type !== 'Identifier' || prop.key.name !== 'setup') return

      bodyNode = prop.body
    })
    if (!bodyNode) {
      return
    }

    s.prepend('\n')
    s.prepend(
      `
const set = (a, b) => {
  _set(a, unref(b))
}
`.trim()
    )
    s.prepend('\n')
    s.prepend("import { ref, unref } from 'vue'\n")
    s.prepend("import { reactify, set as _set } from '@vueuse/shared'\n")
    s.prepend("import { sum } from 'vue-chemistry/math'\n")
    s.prepend('\n')

    const rewriteStatements = (node: Statement | Expression) => {
      if (node.type === 'VariableDeclaration') {
        node.declarations.forEach(decl => {
          const init = decl.init
          if (init && init.start && init.end) {
            if (
              init.type === 'ArrowFunctionExpression' ||
              init.type === 'FunctionExpression'
            ) {
              if (init.body.type === 'BlockStatement') {
                init.body.body.forEach(node => rewriteStatements(node))
              }
              // s.prependLeft(init.start, 'reactify(')
              // s.appendRight(init.end, ')')
            } else if (init.type === 'NumericLiteral') {
              s.prependLeft(init.start, 'ref(')
              s.appendRight(init.end, ')')
            } else {
              rewriteStatements(init)
            }
          }
        })
      } else if (node.type === 'ExpressionStatement') {
        const exp = node.expression
        rewriteStatements(exp)
      } else if (node.type === 'AssignmentExpression') {
        const lhs = node.left
        const rhs = node.right
        rewriteStatements(rhs)
        s.prependLeft(lhs.start!, 'set(')
        s.overwrite(lhs.end!, rhs.start!, ', ')
        s.appendRight(rhs.end!, ')')
      } else if (node.type === 'BinaryExpression') {
        const lhs = node.left
        const rhs = node.right
        if (node.operator === '+') {
          s.prependRight(lhs.start!, 'sum(')
        }
        s.overwrite(lhs.end!, rhs.start!, ', ')
        s.appendLeft(rhs.end!, ')')
      }
    }

    const n = bodyNode as BlockStatement
    n.body.forEach(node => rewriteStatements(node))

    const cs = new MagicString(code)
    cs.overwrite(
      descriptor.script.loc.start.offset,
      descriptor.script.loc.end.offset,
      s.toString()
    )

    console.log(cs.toString())

    return {
      code: cs.toString(),
      map: cs.generateMap()
    }
  }

  return {
    name: 'chemiscript',
    enforce: 'pre',
    transform
  }
}
