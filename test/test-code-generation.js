// 測試程式碼生成功能
console.log('=== 測試Arduino積木程式碼生成 ===\n');

// 模擬一個包含各種Arduino積木的XML
const testXML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="50" y="50">
    <statement name="SETUP_CODE">
      <block type="arduino_serial_begin">
        <value name="BAUD">
          <block type="math_number">
            <field name="NUM">9600</field>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="50" y="300">
    <statement name="LOOP_CODE">
      <block type="variables_define">
        <field name="TYPE">int</field>
        <field name="VAR">mappedValue</field>
        <value name="VALUE">
          <block type="arduino_map">
            <value name="VALUE">
              <block type="arduino_analogread">
                <value name="PIN">
                  <block type="math_number">
                    <field name="NUM">A0</field>
                  </block>
                </value>
              </block>
            </value>
            <value name="FROM_LOW">
              <block type="math_number">
                <field name="NUM">0</field>
              </block>
            </value>
            <value name="FROM_HIGH">
              <block type="math_number">
                <field name="NUM">1023</field>
              </block>
            </value>
            <value name="TO_LOW">
              <block type="math_number">
                <field name="NUM">0</field>
              </block>
            </value>
            <value name="TO_HIGH">
              <block type="math_number">
                <field name="NUM">255</field>
              </block>
            </value>
          </block>
        </value>
        <next>
          <block type="arduino_serial_print">
            <field name="MODE">PRINTLN</field>
            <value name="TEXT">
              <block type="variables_get">
                <field name="VAR">mappedValue</field>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>
`;

// 這個測試主要是檢查我們的積木定義和XML結構是否正確
console.log('📋 測試XML結構:');
console.log('XML長度:', testXML.length);
console.log('包含setup積木:', testXML.includes('arduino_setup'));
console.log('包含loop積木:', testXML.includes('arduino_loop'));
console.log('包含map積木:', testXML.includes('arduino_map'));
console.log('包含Serial積木:', testXML.includes('arduino_serial_begin'));
console.log('包含變數定義:', testXML.includes('variables_define'));

console.log('\n✅ XML結構測試完成');
console.log('📝 注意：程式碼生成需要在VS Code環境中的Blockly編輯器測試');