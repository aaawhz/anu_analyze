

export var hasSymbol = typeof Symbol === "function" && Symbol["for"]; 

export var REACT_ELEMENT_TYPE = hasSymbol ? Symbol["for"]("react.element") : 0xeac7;
export var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol["for"]("react.fragment") : 0xeacb;

export var innerHTML = "dangerouslySetInnerHTML";

export var __push = Array.prototype.push;
export var hasOwnProperty = Object.prototype.hasOwnProperty;

export var emptyArray = [];
export var emptyObject = {};

//过时的警告
export function deprecatedWarn(methodName) {
    //判断是否存放过改警告
    if (!deprecatedWarn[methodName]) {
        //eslint-disable-next-line
        console.warn(methodName + " is deprecated");
        deprecatedWarn[methodName] = 1;
    }
}

/**
 * 复制一个对象的属性到另一个对象  ！复制第一层！
 *
 * @param {any} obj
 * @param {any} props
 * @returns
 */
export function extend(obj, props) {
    for (let i in props) {
        if (props.hasOwnProperty(i)) {
            obj[i] = props[i];
        }
    }
    return obj;
}

export function returnFalse() {
    return false;
}
export function returnTrue() {
    return true;
}

export let __type = Object.prototype.toString;

/**
 * 一个空函数
 *
 * @export
 */
export function noop() {}

/**
 * 类继承
 *
 * @export
 * @param {any} SubClass
 * @param {any} SupClass
 */
export function inherit(SubClass, SupClass) {
    function Bridge() {}

    let orig = SubClass.prototype;
    Bridge.prototype = SupClass.prototype;

    // SubClass.prototype = { __proto__: Sublcass.prototype  , ... Subclass构造函数的各种this属性键值对}
    let fn = (SubClass.prototype = new Bridge());

    // 避免原型链拉长导致方法查找的性能开销, 
    //由于是地址引用， 所以fn扩展了orig的属性， 相当于 SubClas.prototype也重新追加自己的原型属性，
    //这里是继承， 但是自己的东西还是不会少的 ， \(^o^)/~  

    extend(fn, orig);

    fn.constructor = SubClass;
    return fn;
}

var lowerCache = {};

export function toLowerCase(s) {
    return lowerCache[s] || (lowerCache[s] = s.toLowerCase());
}

//实实在在清空数组
export function clearArray(a) {
    return a.splice(0, a.length);
}

export function isFn(obj) {
    return __type.call(obj) === "[object Function]";
}

//判断一个字符串， 非 逗号 空格 的所有字符， 如：

//'abc ddd, adaf'.match(rword)
//(3) ["abc", "ddd", "adaf"]

var rword = /[^, ]+/g;

//改造字符串 或者 数组 成一个对象形式 
//{ a: 1, b:1, c: 1}
export function oneObject(array, val) {
    if (array + "" === array) {
        //利用字符串的特征进行优化，字符串加上一个空字符串等于自身
        array = array.match(rword) || [];
    }
    let result = {},
        //eslint-disable-next-line
        value = val !== void 666 ? val : 1;
    for (let i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value;
    }
    return result;
}

//匹配 abc-abc  abc_abc 这样的字符串
var rcamelize = /[-_][^-_]/g;

export function camelize(target) {
    //提前判断，提高getStyle等的效率
    if (!target || (target.indexOf("-") < 0 && target.indexOf("_") < 0)) {
        return target;
    }


    //转换为驼峰风格  abc-abc = >  abcAbc
    var str = target.replace(rcamelize, function(match) {
        //match就是-a; 
        //把-a 替换成 A
        return match.charAt(1).toUpperCase();
    });


    return firstLetterLower(str);
}

//把第一个字符变成小写 AbcAbc => abcAbc
export function firstLetterLower(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

//为这些React生命周期函数统一赋值
export var options = oneObject(["beforeProps", "afterCreate", "beforeInsert", "beforeDelete",
 "beforeUpdate", "afterUpdate", "beforePatch", "afterPatch", "beforeUnmount", "afterMount"], noop);

var numberMap = {
    //null undefined IE6-8这里会返回[object Object]
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7
};
// undefined: 0, null: 1, boolean:2, number: 3, string: 4, function: 5, symbol:6, array: 7, object:8
export function typeNumber(data) {
    if (data === null) {
        return 1;
    }
    if (data === void 666) {
        return 0;
    }
    var a = numberMap[__type.call(data)];

    //如果是 [object Object] 就返回 8
    return a || 8;
}

//转换类数组
export var toArray =
    Array.from ||
    function(a) {
        var ret = [];
        for (var i = 0, n = a.length; i < n; i++) {
            ret[i] = a[i];
        }
        return ret;
    };
