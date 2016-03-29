module.exports = {
    isFunction: function (o) { return this.isType(o, 'Function'); },
    isObject: function (o) { return o === Object(o); },
    isString: function (o) { return this.isType(o, 'String'); },
    isType: function (o, type) {
        return Object.prototype.toString.call(o) == '[object ' + type + ']';
    },
    asNumber: function (v, def) {
        if (isNaN(def)) def = 0;
        if (!v) return def;
        v = v * 1;
        if (isNaN(v)) return def;
        
        return v;
    },
    noop: function () { }
};