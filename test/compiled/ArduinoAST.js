"use strict";
/**
 * Arduino C++ AST (抽象語法樹) 定義
 * 專門針對Arduino程式設計的簡化AST結構
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTUtils = exports.ASTNodeType = void 0;
var ASTNodeType;
(function (ASTNodeType) {
    // 程式結構
    ASTNodeType["PROGRAM"] = "Program";
    ASTNodeType["FUNCTION_DECLARATION"] = "FunctionDeclaration";
    ASTNodeType["VARIABLE_DECLARATION"] = "VariableDeclaration";
    ASTNodeType["BLOCK_STATEMENT"] = "BlockStatement";
    // 語句類型
    ASTNodeType["EXPRESSION_STATEMENT"] = "ExpressionStatement";
    ASTNodeType["IF_STATEMENT"] = "IfStatement";
    ASTNodeType["FOR_STATEMENT"] = "ForStatement";
    ASTNodeType["WHILE_STATEMENT"] = "WhileStatement";
    ASTNodeType["RETURN_STATEMENT"] = "ReturnStatement";
    // 表達式類型
    ASTNodeType["CALL_EXPRESSION"] = "CallExpression";
    ASTNodeType["BINARY_EXPRESSION"] = "BinaryExpression";
    ASTNodeType["UNARY_EXPRESSION"] = "UnaryExpression";
    ASTNodeType["ASSIGNMENT_EXPRESSION"] = "AssignmentExpression";
    ASTNodeType["IDENTIFIER"] = "Identifier";
    ASTNodeType["LITERAL"] = "Literal";
    ASTNodeType["MEMBER_EXPRESSION"] = "MemberExpression";
    // Arduino特殊節點
    ASTNodeType["ARDUINO_PIN"] = "ArduinoPin";
})(ASTNodeType || (exports.ASTNodeType = ASTNodeType = {}));
// AST 工具函數
class ASTUtils {
    /**
     * 判斷是否為Arduino函數
     */
    static isArduinoFunction(name) {
        const arduinoFunctions = [
            'digitalWrite', 'digitalRead', 'pinMode',
            'analogWrite', 'analogRead',
            'delay', 'delayMicroseconds',
            'setup', 'loop'
        ];
        return arduinoFunctions.includes(name);
    }
    /**
     * 判斷是否為Arduino常數
     */
    static isArduinoConstant(name) {
        const arduinoConstants = [
            'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP',
            'true', 'false'
        ];
        return arduinoConstants.includes(name);
    }
    /**
     * 判斷是否為類比腳位
     */
    static isAnalogPin(pin) {
        return /^A\d+$/.test(pin);
    }
    /**
     * 遍歷AST節點
     */
    static traverse(node, visitor) {
        visitor(node);
        switch (node.type) {
            case ASTNodeType.PROGRAM:
                node.body.forEach(child => this.traverse(child, visitor));
                break;
            case ASTNodeType.FUNCTION_DECLARATION:
                const func = node;
                this.traverse(func.name, visitor);
                func.params.forEach(param => this.traverse(param, visitor));
                this.traverse(func.body, visitor);
                break;
            case ASTNodeType.BLOCK_STATEMENT:
                node.body.forEach(child => this.traverse(child, visitor));
                break;
            case ASTNodeType.IF_STATEMENT:
                const ifStmt = node;
                this.traverse(ifStmt.test, visitor);
                this.traverse(ifStmt.consequent, visitor);
                if (ifStmt.alternate)
                    this.traverse(ifStmt.alternate, visitor);
                break;
            case ASTNodeType.FOR_STATEMENT:
                const forStmt = node;
                if (forStmt.init)
                    this.traverse(forStmt.init, visitor);
                if (forStmt.test)
                    this.traverse(forStmt.test, visitor);
                if (forStmt.update)
                    this.traverse(forStmt.update, visitor);
                this.traverse(forStmt.body, visitor);
                break;
            case ASTNodeType.WHILE_STATEMENT:
                const whileStmt = node;
                this.traverse(whileStmt.test, visitor);
                this.traverse(whileStmt.body, visitor);
                break;
            case ASTNodeType.EXPRESSION_STATEMENT:
                this.traverse(node.expression, visitor);
                break;
            case ASTNodeType.CALL_EXPRESSION:
                const callExpr = node;
                this.traverse(callExpr.callee, visitor);
                callExpr.arguments.forEach(arg => this.traverse(arg, visitor));
                break;
            case ASTNodeType.BINARY_EXPRESSION:
                const binExpr = node;
                this.traverse(binExpr.left, visitor);
                this.traverse(binExpr.right, visitor);
                break;
            case ASTNodeType.UNARY_EXPRESSION:
                this.traverse(node.argument, visitor);
                break;
            case ASTNodeType.ASSIGNMENT_EXPRESSION:
                const assignExpr = node;
                this.traverse(assignExpr.left, visitor);
                this.traverse(assignExpr.right, visitor);
                break;
            case ASTNodeType.MEMBER_EXPRESSION:
                const memberExpr = node;
                this.traverse(memberExpr.object, visitor);
                this.traverse(memberExpr.property, visitor);
                break;
            case ASTNodeType.VARIABLE_DECLARATION:
                const varDecl = node;
                this.traverse(varDecl.name, visitor);
                if (varDecl.initializer)
                    this.traverse(varDecl.initializer, visitor);
                break;
            // Leaf nodes - no children to traverse
            case ASTNodeType.IDENTIFIER:
            case ASTNodeType.LITERAL:
            case ASTNodeType.ARDUINO_PIN:
                break;
        }
    }
    /**
     * 查找特定類型的節點
     */
    static findNodes(root, type) {
        const results = [];
        this.traverse(root, (node) => {
            if (node.type === type) {
                results.push(node);
            }
        });
        return results;
    }
}
exports.ASTUtils = ASTUtils;
