"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// src/index.ts
var _compilersfc = require('@vue/compiler-sfc');
var _parser = require('@babel/parser');
var _magicstring = require('magic-string'); var _magicstring2 = _interopRequireDefault(_magicstring);
var chemiscript = () => {
  const transform = function(code, id) {
    if (!id.endsWith(".vue")) {
      return null;
    }
    const {descriptor, errors} = _compilersfc.parse.call(void 0, code);
    if (errors.length > 0) {
      return null;
    }
    if (!descriptor.script || !descriptor.script.attrs.chemi) {
      return null;
    }
    const input = descriptor.script.content;
    const s = new (0, _magicstring2.default)(input);
    const ast = _parser.parse.call(void 0, input, {
      sourceType: "module"
    }).program.body;
    let exportObjectNode = null;
    ast.forEach((node2) => {
      if (node2.type !== "ExportDefaultDeclaration")
        return;
      const decl = node2.declaration;
      if (decl.type === "ObjectExpression") {
        exportObjectNode = decl;
        return;
      }
      if (decl.type === "CallExpression") {
        if (decl.arguments.length > 0) {
          const arg = decl.arguments[0];
          if ((arg == null ? void 0 : arg.type) === "ObjectExpression") {
            exportObjectNode = arg;
          }
        }
      }
    });
    if (!exportObjectNode) {
      return;
    }
    const node = exportObjectNode;
    let bodyNode = null;
    node.properties.forEach((prop) => {
      if (prop.type !== "ObjectMethod")
        return;
      if (prop.key.type !== "Identifier" || prop.key.name !== "setup")
        return;
      bodyNode = prop.body;
    });
    if (!bodyNode) {
      return;
    }
    s.prepend("\n");
    s.prepend(`
const set = (a, b) => {
  _set(a, unref(b))
}
`.trim());
    s.prepend("\n");
    s.prepend("import { ref, unref } from 'vue'\n");
    s.prepend("import { reactify, set as _set } from 'vue-chemistry'\n");
    s.prepend("import { sum } from 'vue-chemistry/math'\n");
    s.prepend("\n");
    const rewriteStatements = (node2) => {
      if (node2.type === "VariableDeclaration") {
        node2.declarations.forEach((decl) => {
          const init = decl.init;
          if (init && init.start && init.end) {
            if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
              if (init.body.type === "BlockStatement") {
                init.body.body.forEach((node3) => rewriteStatements(node3));
              }
            } else if (init.type === "NumericLiteral") {
              s.prependLeft(init.start, "ref(");
              s.appendRight(init.end, ")");
            } else {
              rewriteStatements(init);
            }
          }
        });
      } else if (node2.type === "ExpressionStatement") {
        const exp = node2.expression;
        rewriteStatements(exp);
      } else if (node2.type === "AssignmentExpression") {
        const lhs = node2.left;
        const rhs = node2.right;
        rewriteStatements(rhs);
        s.prependLeft(lhs.start, "set(");
        s.overwrite(lhs.end, rhs.start, ", ");
        s.appendRight(rhs.end, ")");
      } else if (node2.type === "BinaryExpression") {
        const lhs = node2.left;
        const rhs = node2.right;
        if (node2.operator === "+") {
          s.prependRight(lhs.start, "sum(");
        }
        s.overwrite(lhs.end, rhs.start, ", ");
        s.appendLeft(rhs.end, ")");
      }
    };
    const n = bodyNode;
    n.body.forEach((node2) => rewriteStatements(node2));
    const cs = new (0, _magicstring2.default)(code);
    cs.overwrite(descriptor.script.loc.start.offset, descriptor.script.loc.end.offset, s.toString());
    console.log(cs.toString());
    return {
      code: cs.toString(),
      map: cs.generateMap()
    };
  };
  return {
    name: "chemiscript",
    enforce: "pre",
    transform
  };
};


exports.chemiscript = chemiscript;
