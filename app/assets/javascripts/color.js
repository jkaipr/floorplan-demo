var Pulsar = Pulsar || {};

Pulsar.Color = {
    gradientPointColor: function(p, rgb_beginning, rgb_end) {
        var w = p * 2 - 1;
        var w1 = (w + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = {
            r: parseInt(rgb_beginning.r * w1 + rgb_end.r * w2),
            g: parseInt(rgb_beginning.g * w1 + rgb_end.g * w2),
            b: parseInt(rgb_beginning.b * w1 + rgb_end.b * w2)
        };
        return rgb;
    },
    componentToHex: function(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    },
    rgbToHex: function(rgb) {
        return "#" + this.componentToHex(rgb.r) + this.componentToHex(rgb.g) + this.componentToHex(rgb.b);
    },
    hexToRgb: function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
};
