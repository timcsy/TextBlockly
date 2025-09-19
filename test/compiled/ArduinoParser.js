"use strict";
/**
 * Arduino C++ 語法分析器 (Parser)
 * 將token流解析為AST
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArduinoParser = void 0;
const ArduinoAST_1 = require("./ArduinoAST");
const ArduinoTokenizer_1 = require("./ArduinoTokenizer");
class ArduinoParser {
    constructor(code) {
        this.current = 0;
        const tokenizer = new ArduinoTokenizer_1.ArduinoTokenizer(code);
        this.tokens = tokenizer.tokenize().filter(token => token.type !== ArduinoTokenizer_1.TokenType.WHITESPACE &&
            token.type !== ArduinoTokenizer_1.TokenType.COMMENT);
    }
    /**
     * 解析程式碼為AST
     */
    parse() {
        const body = [];
        while (!this.isEOF()) {
            try {
                const node = this.parseTopLevel();
                if (node) {
                    body.push(node);
                }
            }
            catch (error) {
                console.error('Parse error:', error);
                // 跳到下一個可能的起始點
                this.skipToNextStatement();
            }
        }
        return {
            type: ArduinoAST_1.ASTNodeType.PROGRAM,
            body
        };
    }
    /**
     * 解析頂層聲明
     */
    parseTopLevel() {
        // 跳過任何分號
        while (this.match(ArduinoTokenizer_1.TokenType.SEMICOLON)) { }
        if (this.isEOF())
            return null;
        // 檢查是否為函數聲明
        if (this.isTypeToken(this.peek()) && this.isIdentifier(this.peek(1))) {
            const nextToken = this.peek(2);
            if (nextToken && nextToken.type === ArduinoTokenizer_1.TokenType.LEFT_PAREN) {
                return this.parseFunctionDeclaration();
            }
            else {
                return this.parseVariableDeclaration();
            }
        }
        // 跳過無法識別的token
        this.advance();
        return null;
    }
    /**
     * 解析函數聲明
     */
    parseFunctionDeclaration() {
        const returnType = this.advance().value; // 返回類型
        const name = this.parseIdentifier(); // 函數名
        this.consume(ArduinoTokenizer_1.TokenType.LEFT_PAREN, "Expected '(' after function name");
        const params = [];
        if (!this.check(ArduinoTokenizer_1.TokenType.RIGHT_PAREN)) {
            do {
                params.push(this.parseParameter());
            } while (this.match(ArduinoTokenizer_1.TokenType.COMMA));
        }
        this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
        const body = this.parseBlockStatement();
        return {
            type: ArduinoAST_1.ASTNodeType.FUNCTION_DECLARATION,
            name,
            returnType,
            params,
            body
        };
    }
    /**
     * 解析參數
     */
    parseParameter() {
        const dataType = this.advance().value;
        const name = this.parseIdentifier();
        return {
            type: ArduinoAST_1.ASTNodeType.VARIABLE_DECLARATION,
            dataType,
            name
        };
    }
    /**
     * 解析變數聲明
     */
    parseVariableDeclaration() {
        const dataType = this.advance().value;
        const name = this.parseIdentifier();
        let initializer;
        if (this.match(ArduinoTokenizer_1.TokenType.ASSIGN)) {
            initializer = this.parseExpression();
        }
        this.consume(ArduinoTokenizer_1.TokenType.SEMICOLON, "Expected ';' after variable declaration");
        return {
            type: ArduinoAST_1.ASTNodeType.VARIABLE_DECLARATION,
            dataType,
            name,
            initializer
        };
    }
    /**
     * 解析區塊語句
     */
    parseBlockStatement() {
        const body = [];
        this.consume(ArduinoTokenizer_1.TokenType.LEFT_BRACE, "Expected '{'");
        while (!this.check(ArduinoTokenizer_1.TokenType.RIGHT_BRACE) && !this.isEOF()) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        this.consume(ArduinoTokenizer_1.TokenType.RIGHT_BRACE, "Expected '}'");
        return {
            type: ArduinoAST_1.ASTNodeType.BLOCK_STATEMENT,
            body
        };
    }
    /**
     * 解析語句
     */
    parseStatement() {
        try {
            // if 語句
            if (this.match(ArduinoTokenizer_1.TokenType.IF)) {
                return this.parseIfStatement();
            }
            // for 語句
            if (this.match(ArduinoTokenizer_1.TokenType.FOR)) {
                return this.parseForStatement();
            }
            // while 語句
            if (this.match(ArduinoTokenizer_1.TokenType.WHILE)) {
                return this.parseWhileStatement();
            }
            // 區塊語句
            if (this.check(ArduinoTokenizer_1.TokenType.LEFT_BRACE)) {
                return this.parseBlockStatement();
            }
            // 變數宣告
            if (this.isTypeToken(this.peek())) {
                return this.parseVariableDeclaration();
            }
            // 表達式語句
            return this.parseExpressionStatement();
        }
        catch (error) {
            console.error('Statement parse error:', error);
            this.skipToNextStatement();
            return null;
        }
    }
    /**
     * 解析if語句
     */
    parseIfStatement() {
        this.consume(ArduinoTokenizer_1.TokenType.LEFT_PAREN, "Expected '(' after 'if'");
        const test = this.parseExpression();
        this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after if condition");
        const consequent = this.parseStatement();
        let alternate;
        if (this.match(ArduinoTokenizer_1.TokenType.ELSE)) {
            alternate = this.parseStatement();
        }
        return {
            type: ArduinoAST_1.ASTNodeType.IF_STATEMENT,
            test,
            consequent,
            alternate
        };
    }
    /**
     * 解析for語句
     */
    parseForStatement() {
        this.consume(ArduinoTokenizer_1.TokenType.LEFT_PAREN, "Expected '(' after 'for'");
        let init;
        if (!this.check(ArduinoTokenizer_1.TokenType.SEMICOLON)) {
            if (this.isTypeToken(this.peek())) {
                init = this.parseVariableDeclaration();
                // 變數宣告已經消耗了分號
            }
            else {
                const expr = this.parseAssignmentExpression();
                if (expr.type === ArduinoAST_1.ASTNodeType.ASSIGNMENT_EXPRESSION) {
                    init = expr;
                }
                this.consume(ArduinoTokenizer_1.TokenType.SEMICOLON, "Expected ';' after for-loop initializer");
            }
        }
        else {
            this.consume(ArduinoTokenizer_1.TokenType.SEMICOLON, "Expected ';'");
        }
        let test;
        if (!this.check(ArduinoTokenizer_1.TokenType.SEMICOLON)) {
            test = this.parseExpression();
        }
        this.consume(ArduinoTokenizer_1.TokenType.SEMICOLON, "Expected ';' after for-loop condition");
        let update;
        if (!this.check(ArduinoTokenizer_1.TokenType.RIGHT_PAREN)) {
            update = this.parseExpression();
        }
        this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after for-loop");
        const body = this.parseStatement();
        return {
            type: ArduinoAST_1.ASTNodeType.FOR_STATEMENT,
            init,
            test,
            update,
            body
        };
    }
    /**
     * 解析while語句
     */
    parseWhileStatement() {
        this.consume(ArduinoTokenizer_1.TokenType.LEFT_PAREN, "Expected '(' after 'while'");
        const test = this.parseExpression();
        this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after while condition");
        const body = this.parseStatement();
        return {
            type: ArduinoAST_1.ASTNodeType.WHILE_STATEMENT,
            test,
            body
        };
    }
    /**
     * 解析表達式語句
     */
    parseExpressionStatement() {
        const expression = this.parseExpression();
        this.consume(ArduinoTokenizer_1.TokenType.SEMICOLON, "Expected ';' after expression");
        return {
            type: ArduinoAST_1.ASTNodeType.EXPRESSION_STATEMENT,
            expression
        };
    }
    /**
     * 解析表達式（入口點）
     */
    parseExpression() {
        return this.parseAssignmentExpression();
    }
    /**
     * 解析賦值表達式
     */
    parseAssignmentExpression() {
        const expr = this.parseLogicalOrExpression();
        if (this.match(ArduinoTokenizer_1.TokenType.ASSIGN, ArduinoTokenizer_1.TokenType.PLUS_ASSIGN)) {
            const operator = this.previous().value;
            const right = this.parseAssignmentExpression();
            return {
                type: ArduinoAST_1.ASTNodeType.ASSIGNMENT_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析邏輯或表達式
     */
    parseLogicalOrExpression() {
        let expr = this.parseLogicalAndExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.LOGICAL_OR)) {
            const operator = this.previous().value;
            const right = this.parseLogicalAndExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析邏輯與表達式
     */
    parseLogicalAndExpression() {
        let expr = this.parseEqualityExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.LOGICAL_AND)) {
            const operator = this.previous().value;
            const right = this.parseEqualityExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析相等表達式
     */
    parseEqualityExpression() {
        let expr = this.parseComparisonExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.EQUAL, ArduinoTokenizer_1.TokenType.NOT_EQUAL)) {
            const operator = this.previous().value;
            const right = this.parseComparisonExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析比較表達式
     */
    parseComparisonExpression() {
        let expr = this.parseArithmeticExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.GREATER_THAN, ArduinoTokenizer_1.TokenType.GREATER_EQUAL, ArduinoTokenizer_1.TokenType.LESS_THAN, ArduinoTokenizer_1.TokenType.LESS_EQUAL)) {
            const operator = this.previous().value;
            const right = this.parseArithmeticExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析算術表達式
     */
    parseArithmeticExpression() {
        let expr = this.parseTermExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.PLUS, ArduinoTokenizer_1.TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.parseTermExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析項表達式
     */
    parseTermExpression() {
        let expr = this.parseUnaryExpression();
        while (this.match(ArduinoTokenizer_1.TokenType.MULTIPLY, ArduinoTokenizer_1.TokenType.DIVIDE, ArduinoTokenizer_1.TokenType.MODULO)) {
            const operator = this.previous().value;
            const right = this.parseUnaryExpression();
            expr = {
                type: ArduinoAST_1.ASTNodeType.BINARY_EXPRESSION,
                operator,
                left: expr,
                right
            };
        }
        return expr;
    }
    /**
     * 解析一元表達式
     */
    parseUnaryExpression() {
        if (this.match(ArduinoTokenizer_1.TokenType.LOGICAL_NOT, ArduinoTokenizer_1.TokenType.MINUS, ArduinoTokenizer_1.TokenType.PLUS)) {
            const operator = this.previous().value;
            const argument = this.parseUnaryExpression();
            return {
                type: ArduinoAST_1.ASTNodeType.UNARY_EXPRESSION,
                operator,
                argument
            };
        }
        return this.parsePostfixExpression();
    }
    /**
     * 解析後綴表達式
     */
    parsePostfixExpression() {
        let expr = this.parsePrimaryExpression();
        while (true) {
            if (this.match(ArduinoTokenizer_1.TokenType.LEFT_PAREN)) {
                // 函數調用
                const args = [];
                if (!this.check(ArduinoTokenizer_1.TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(ArduinoTokenizer_1.TokenType.COMMA));
                }
                this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after arguments");
                expr = {
                    type: ArduinoAST_1.ASTNodeType.CALL_EXPRESSION,
                    callee: expr,
                    arguments: args
                };
            }
            else if (this.match(ArduinoTokenizer_1.TokenType.DOT)) {
                // 成員訪問
                const property = this.parseIdentifier();
                expr = {
                    type: ArduinoAST_1.ASTNodeType.MEMBER_EXPRESSION,
                    object: expr,
                    property,
                    computed: false
                };
            }
            else if (this.match(ArduinoTokenizer_1.TokenType.INCREMENT, ArduinoTokenizer_1.TokenType.DECREMENT)) {
                // 後綴增減 (目前簡化處理)
                const operator = this.previous().value;
                expr = {
                    type: ArduinoAST_1.ASTNodeType.UNARY_EXPRESSION,
                    operator: operator + '_post',
                    argument: expr
                };
            }
            else {
                break;
            }
        }
        return expr;
    }
    /**
     * 解析主要表達式
     */
    parsePrimaryExpression() {
        // 數字
        if (this.check(ArduinoTokenizer_1.TokenType.NUMBER)) {
            const token = this.advance();
            return {
                type: ArduinoAST_1.ASTNodeType.LITERAL,
                value: parseFloat(token.value),
                raw: token.value
            };
        }
        // 字串
        if (this.check(ArduinoTokenizer_1.TokenType.STRING)) {
            const token = this.advance();
            return {
                type: ArduinoAST_1.ASTNodeType.LITERAL,
                value: token.value.slice(1, -1), // 移除引號
                raw: token.value
            };
        }
        // 布林值和Arduino常數
        if (this.match(ArduinoTokenizer_1.TokenType.BOOLEAN, ArduinoTokenizer_1.TokenType.HIGH, ArduinoTokenizer_1.TokenType.LOW, ArduinoTokenizer_1.TokenType.INPUT, ArduinoTokenizer_1.TokenType.OUTPUT, ArduinoTokenizer_1.TokenType.INPUT_PULLUP)) {
            const token = this.previous();
            return {
                type: ArduinoAST_1.ASTNodeType.LITERAL,
                value: token.value,
                raw: token.value
            };
        }
        // 標識符（包括Arduino腳位）
        if (this.check(ArduinoTokenizer_1.TokenType.IDENTIFIER)) {
            const token = this.advance();
            // 檢查是否為Arduino類比腳位
            if (ArduinoAST_1.ASTUtils.isAnalogPin(token.value)) {
                return {
                    type: ArduinoAST_1.ASTNodeType.ARDUINO_PIN,
                    pin: token.value,
                    isAnalog: true
                };
            }
            return {
                type: ArduinoAST_1.ASTNodeType.IDENTIFIER,
                name: token.value
            };
        }
        // 括號表達式
        if (this.match(ArduinoTokenizer_1.TokenType.LEFT_PAREN)) {
            const expr = this.parseExpression();
            this.consume(ArduinoTokenizer_1.TokenType.RIGHT_PAREN, "Expected ')' after expression");
            return expr;
        }
        throw new Error(`Unexpected token: ${this.peek()?.value || 'EOF'}`);
    }
    /**
     * 解析標識符
     */
    parseIdentifier() {
        const token = this.consume(ArduinoTokenizer_1.TokenType.IDENTIFIER, "Expected identifier");
        return {
            type: ArduinoAST_1.ASTNodeType.IDENTIFIER,
            name: token.value
        };
    }
    // 工具方法
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isEOF())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isEOF())
            this.current++;
        return this.previous();
    }
    isEOF() {
        return this.peek().type === ArduinoTokenizer_1.TokenType.EOF;
    }
    peek(offset = 0) {
        const index = this.current + offset;
        if (index >= this.tokens.length) {
            return this.tokens[this.tokens.length - 1]; // EOF token
        }
        return this.tokens[index];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        const current = this.peek();
        throw new Error(`${message}. Got ${current.type}: "${current.value}" at line ${current.line}`);
    }
    isTypeToken(token) {
        if (!token)
            return false;
        return [ArduinoTokenizer_1.TokenType.VOID, ArduinoTokenizer_1.TokenType.INT, ArduinoTokenizer_1.TokenType.FLOAT, ArduinoTokenizer_1.TokenType.CHAR,
            ArduinoTokenizer_1.TokenType.BOOLEAN_TYPE, ArduinoTokenizer_1.TokenType.STRING_TYPE].includes(token.type);
    }
    isIdentifier(token) {
        return token?.type === ArduinoTokenizer_1.TokenType.IDENTIFIER;
    }
    skipToNextStatement() {
        while (!this.isEOF() && !this.check(ArduinoTokenizer_1.TokenType.SEMICOLON) && !this.check(ArduinoTokenizer_1.TokenType.RIGHT_BRACE)) {
            this.advance();
        }
        if (this.check(ArduinoTokenizer_1.TokenType.SEMICOLON)) {
            this.advance();
        }
    }
}
exports.ArduinoParser = ArduinoParser;
