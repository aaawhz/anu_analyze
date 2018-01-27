import { typeNumber } from "./util";
import { Refs } from "./Refs";
//用于后端的元素节点
export function DOMElement(type) {
    this.nodeName = type;
    this.style = {};
    this.children = [];
}

//请注意开头的部分xml声明，与svg的命名空间xmlns、版本version等部分，
//主要是考虑兼容性的问题；这些部分在HTML5中基本都可以不用写了(写不写还是自己瞧着办吧)。
export var NAMESPACE = {
    svg: "http://www.w3.org/2000/svg",
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    math: "http://www.w3.org/1998/Math/MathML"
};

var fn = (DOMElement.prototype = {
    contains: Boolean
});

//把这些原生DOM方法 扩展到 自定义 的 DOMElement中；  结果DOMElement也有下面这些节点方法
String(
    "replaceChild,appendChild,removeAttributeNS,setAttributeNS,removeAttribute,setAttribute" +
        ",getAttribute,insertBefore,removeChild,addEventListener,removeEventListener,attachEvent" +
        ",detachEvent"
).replace(/\w+/g, function(name) {
    fn[name] = function() {
        console.log("fire " + name); // eslint-disable-line
    };
});

//用于后端的document
export var fakeDoc = new DOMElement();
fakeDoc.createElement = fakeDoc.createElementNS = fakeDoc.createDocumentFragment = function(type) {
    return new DOMElement(type);
};
fakeDoc.createTextNode = fakeDoc.createComment = Boolean;
fakeDoc.documentElement = new DOMElement("html");
fakeDoc.body = new DOMElement("body");
fakeDoc.nodeName = "#document";
fakeDoc.textContent = "";


//通过访问window.alert判断是在 【浏览器】 还是 【服务器】 环境
try {
    var w = window;
    var b = !!w.alert;
} catch (e) {
    b = false;
    w = {
        //给服务器环境的window赋值
        document: fakeDoc
    };
}

export var inBrowser = b;
export var win = w;

export var document = w.document || fakeDoc;

//常用html html5 可输入组件的类型， 如果多选就是 2 或 3
export var duplexMap = {
    color: 1,
    date: 1,
    datetime: 1,
    "datetime-local": 1,
    email: 1,
    month: 1,
    number: 1,
    password: 1,
    range: 1,
    search: 1,
    tel: 1,
    text: 1,
    time: 1,
    url: 1,
    week: 1,
    textarea: 1,
    checkbox: 2,
    radio: 2,
    "select-one": 3,
    "select-multiple": 3
};

//ie 6,7,8的文档模式以及怪异模式下的ie都会返回 false;
var isStandard = "textContent" in document;

var fragment = document.createDocumentFragment();

//移除所有子节点， 
export function emptyElement(node) {
    var child;
    while ((child = node.firstChild)) {
        //为何要递归
        emptyElement(child);
        node.removeChild(child);
    }
}

//回收文字节点
var recyclables = {
    "#text": []
};

//移除各类节点的方法
export function removeElement(node) {
    if (!node) {
        return;
    }

    //标记Refs 已经被操作
    Refs.nodeOperate = true;

    //元素节点
    if (node.nodeType === 1) {
        if (isStandard) {
            //标准浏览器可以直接清空， 作用相当于删除该节点所有子节点
            node.textContent = "";
        } else {
            //也是先清空所有子节点
            emptyElement(node);
        }
        node.__events = null;
    } else if (node.nodeType === 3) {
        //只回收文本节点
        if (recyclables["#text"].length < 100) {
            recyclables["#text"].push(node);
        }
    }

    //因为 documentFragment不会显现在页面上， 利用它来移除节点；  [ 为什么不直接document.remvoeChild(node)?]
    fragment.appendChild(node);
    fragment.removeChild(node);

    //标记Refs 已经操作结束
    Refs.nodeOperate = false;
}

var versions = {
    88: 7, //IE7-8 objectobject
    80: 6, //IE6 objectundefined
    "00": NaN, // other modern browsers
    "08": NaN
};

/* istanbul ignore next  */
//返回ie的版本 6 7 8 9 10 11； 一般来说document。documentMode就可以获取了版本号了
export var msie = document.documentMode || 
                  versions[typeNumber(document.all) + "" + typeNumber(win.XMLHttpRequest)];

//排除ie9以下的， 其他就是现代浏览器
export var modern = /NaN|undefined/.test(msie) || msie > 8;

//这里创建真实节点
export function createElement(vnode, p) {
    var type = vnode.type,
        ns;
    switch (type) {
        case "#text":
            //只重复利用文本节点
            var node = recyclables[type].pop();
            if (node) {
                node.nodeValue = vnode.text;
                return node;
            }
            return document.createTextNode(vnode.text);
        case "#comment":
            //还可以利用 createComment创建注释节点！
            return document.createComment(vnode.text);
        case "svg":
            ns = NAMESPACE.svg;
            break;
        case "math":
            ns = NAMESPACE.math;
            break;
        case "div":
        case "span":
        case "p":
        case "tr":
        case "td":
        case "li":
            ns = "";
            break;
        default:
            //获取第二个参数提供的namespaceURI ?
            ns = vnode.namespaceURI;
            if (!ns) {
                do {
                    if (p.vtype === 1) {
                        ns = p.namespaceURI;
                        if (p.type === "foreignObject") {
                            ns = "";
                        }
                        break;
                    }
                } while ((p = p.return));
            }
            break;
    }

    try {
        if (ns) {
            vnode.namespaceURI = ns;
            //createElementNS() 方法与 createElement() 方法相似，只是它创建的 Element 
            //节点除了具有指定的名称外，还具有指定的命名空间。只有使用命名空间的 XML 文档才会使用该方法。
            return document.createElementNS(ns, type);
        }
        //eslint-disable-next-line
    } catch (e) {

    }

    return document.createElement(type);
}

//在真实DOM页面中插入新节点
export function insertElement(vnode, insertPoint) {
    //判断该虚拟节点是否已经销毁
    if (vnode._disposed) {
        return;
    }

    //找到可用的父节点
    var p = vnode.return,
        parentNode;

    // ---    
    while (p) {
        if (p.vtype === 1) {
            parentNode = p.stateNode;
            break;
        }
        p = p.superReturn || p.return;
    }

    var dom = vnode.stateNode,
        //如果没有插入点，则插入到当前父节点的第一个节点之前
        after = insertPoint ? insertPoint.nextSibling: parentNode.firstChild;

    if (after === dom) {
        return;
    }

    //标记有节点操作 
    Refs.nodeOperate = true;
    parentNode.insertBefore(dom, after);
    Refs.nodeOperate = false;
}

//---
export function getComponentNodes(children, resolve, debug) {
    var ret = [];
    for (var i in children) {
        var child = children[i];
        var inner = child.stateNode;
        if (child._disposed) {
            continue;
        }
        if (child.vtype < 2) {
            ret.push(inner);
        } else {
            var updater = inner.updater;
            if (child.child) {
                var args = getComponentNodes(updater.children, resolve, debug);
                ret.push.apply(ret, args);
            }
        }
    }
    return ret;
}
