# Arduino 積木系統設計

## 核心功能領域分析

### 1. 基礎 I/O 操作
#### 數位 I/O
- ✅ `pinMode(pin, mode)` - 已實現
- ✅ `digitalWrite(pin, value)` - 已實現
- ✅ `digitalRead(pin)` - 已實現

#### 類比 I/O
- ✅ `analogRead(pin)` - 已實現
- ✅ `analogWrite(pin, value)` - 已實現
- ❌ `analogReference(type)` - 需要添加
- ❌ `analogReadResolution(bits)` - 需要添加

### 2. 時間與延遲
- ✅ `delay(ms)` - 已實現
- ✅ `delayMicroseconds(us)` - 已實現
- ❌ `millis()` - 需要添加
- ❌ `micros()` - 需要添加

### 3. 數學運算
#### 基本數學
- ✅ `+, -, *, /, %` - Blockly內建
- ❌ `pow(base, exp)` - 需要添加
- ❌ `sqrt(x)` - 需要添加
- ❌ `abs(x)` - 需要添加

#### 三角函數
- ❌ `sin(rad)`, `cos(rad)`, `tan(rad)` - 需要添加
- ❌ `asin(x)`, `acos(x)`, `atan(x)` - 需要添加

#### 數值處理
- ❌ `map(value, fromLow, fromHigh, toLow, toHigh)` - 重要！
- ❌ `constrain(x, a, b)` - 重要！
- ❌ `min(x, y)`, `max(x, y)` - 需要添加

### 4. 隨機數與位運算
- ❌ `random(min, max)` - 需要添加
- ❌ `randomSeed(seed)` - 需要添加
- ❌ 位運算: `&, |, ^, ~, <<, >>` - 需要添加

### 5. 通訊協定
#### Serial (UART)
- ✅ `Serial.begin(baud)` - 已實現
- ✅ `Serial.print/println(data)` - 已實現
- ❌ `Serial.available()` - 需要添加
- ❌ `Serial.read()` - 需要添加
- ❌ `Serial.readString()` - 需要添加

#### SPI
- ❌ `SPI.begin()` - 需要添加
- ❌ `SPI.transfer(data)` - 需要添加
- ❌ `SPI.beginTransaction()` - 需要添加

#### I2C (Wire)
- ❌ `Wire.begin()` - 需要添加
- ❌ `Wire.beginTransmission(address)` - 需要添加
- ❌ `Wire.write(data)` - 需要添加
- ❌ `Wire.endTransmission()` - 需要添加
- ❌ `Wire.requestFrom(address, bytes)` - 需要添加

### 6. 中斷與定時器
- ❌ `attachInterrupt(pin, function, mode)` - 需要添加
- ❌ `detachInterrupt(pin)` - 需要添加
- ❌ `noInterrupts()` - 需要添加
- ❌ `interrupts()` - 需要添加

### 7. 高級I/O
- ❌ `tone(pin, frequency)` - 需要添加
- ❌ `noTone(pin)` - 需要添加
- ❌ `pulseIn(pin, value)` - 需要添加
- ❌ `shiftOut(dataPin, clockPin, bitOrder, value)` - 需要添加

### 8. 常用感測器與執行器
#### 感測器
- ❌ 超音波感測器 (HC-SR04)
- ❌ 溫濕度感測器 (DHT11/DHT22)
- ❌ 光敏電阻 (LDR)
- ❌ 加速度計/陀螺儀

#### 執行器
- ❌ 伺服馬達 (Servo)
- ❌ 步進馬達
- ❌ LED矩陣
- ❌ LCD顯示器

### 9. 資料結構
- ❌ 陣列操作
- ❌ 字串陣列
- ❌ 結構體 (struct)

## 優先級排序

### 高優先級 (立即實現)
1. **數學函數**: `map()`, `constrain()`, `min()`, `max()`
2. **時間函數**: `millis()`, `micros()`
3. **Serial進階**: `available()`, `read()`, `readString()`
4. **隨機數**: `random()`, `randomSeed()`

### 中優先級 (第二階段)
1. **高級I/O**: `tone()`, `noTone()`, `pulseIn()`
2. **常用感測器**: 超音波、溫濕度
3. **伺服馬達**: Servo.h 函數庫
4. **中斷**: `attachInterrupt()`

### 低優先級 (未來擴展)
1. **通訊協定**: SPI, I2C
2. **位運算**: 完整位操作
3. **高級資料結構**: 陣列、結構體

## AST轉換設計

### 函數調用映射
```typescript
// 標準函數調用
'millis' -> { type: 'arduino_millis' }
'map' -> { type: 'arduino_map', inputs: { VALUE, FROM_LOW, FROM_HIGH, TO_LOW, TO_HIGH } }

// 物件方法調用
'Serial.available' -> { type: 'arduino_serial_available' }
'Servo.attach' -> { type: 'arduino_servo_attach', inputs: { PIN } }
```

### 程式庫引入檢測
```typescript
// 自動檢測需要的 #include
'Servo' -> '#include <Servo.h>'
'Wire' -> '#include <Wire.h>'
'SPI' -> '#include <SPI.h>'
```