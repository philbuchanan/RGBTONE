/**
 * Copyright 2011-2014 Phil Buchanan
 * 
 * RGBTONE is a simple HEX to RGB (and vise versa) color converting app.
 * It also allows you to save colors for later using local storage.
 * 
 * @version 3.0
 */



var converter;

/**
 * The main app constructor
 * 
 * Handles settings, updating app display, saving and restoring app
 * state (colors) an all events.
 * 
 * @param  settings  an object of settings
 */
function Converter(settings) {
	this.settings = settings || {
		shorthand: true,
		maxSave: 9
	};
	
	this.body = document.body;
	this.form = document.getElementById('form');
	this.hexInput = document.getElementById('hex');
	this.rgbInput = document.getElementById('rgb');
	this.clearBtn = document.getElementById('clear');
	
	this.savedColors = this.getSavedColors() || [];
	this.displaySavedColors();
	
	// Add events
	(function() {
		var color = new Color();
		
		this.hexInput.addEventListener('keyup', color.getRgbValue.bind(color));
		this.rgbInput.addEventListener('keyup', color.getHexValue.bind(color));
		this.hexInput.addEventListener('click', this.selectInput);
		this.rgbInput.addEventListener('click', this.selectInput);
		this.clearBtn.addEventListener('click', this.reset.bind(this));
		
		this.hexInput.focus();
		
		this.form.addEventListener('submit', function(event) {
			event.preventDefault();
			this.saveColor(color);
		}.bind(this));
	}.bind(this)());
}

/**
 * Updates the main app display. Does not render saved colors.
 * 
 * @param  color  an object of the current color
 * @param  mode   the color mode to be updated ('hex' or 'rgb')
 */
Converter.prototype.updateApp = function(color, mode) {
	var inputTextColor = this.getContrast(color.hex);
	
	if (color.valid) {
		if (mode === 'hex') {
			this.hexInput.value = this.getDisplayHex(color.hex);
		}
		else if (mode === 'rgb') {
			this.rgbInput.value = this.getDisplayRgb(color.rgb);
		}
		
		this.body.style.backgroundColor = '#' + color.hex;
		this.body.className = inputTextColor;
	}
};

/**
 * Get the array of saved colors from local storage.
 * 
 * @return  array  an array of color objects or false if no colors saved
 */
Converter.prototype.getSavedColors = function() {
	var retrievedColors = localStorage.getItem('colors');
	
	if (retrievedColors !== null) {
		return JSON.parse(retrievedColors);
	}
	return false;
};

/**
 * Saves a color oject to local storage and updates display.
 * 
 * @param  color  the color object to be saved
 */
Converter.prototype.saveColor = function(color) {
	if (color.valid === true && !this.inSaved(color)) {
		while (this.savedColors.length >= this.settings.maxSave) {
			this.savedColors.pop();
		}
		this.savedColors.unshift({
			hex: color.hex,
			rgb: color.rgb
		});
		
		localStorage.setItem('colors', JSON.stringify(this.savedColors));
		this.displaySavedColors();
	}
};

/**
 * Check if color is already in saved colors array
 * 
 * @param  color  the color to check
 * @return  bool  true if it is, else false
 */
Converter.prototype.inSaved = function(color) {
	var i;
	
	for (i = 0; i < this.savedColors.length; i += 1) {
		if (this.savedColors[i].hex === color.hex) {
			return true;
		}
	}
	return false;
};

/**
 * Renders saved colors
 */
Converter.prototype.displaySavedColors = function() {
	var savedColorsNode = document.getElementById('saved-colors'),
		domFragment = document.createDocumentFragment(),
		width = (this.savedColors.length * 102) + 2;
	
	if (this.savedColors.length > 0) {
	
		this.savedColors.forEach(function(color) {
			var colorNode = document.createElement('div'),
				colorText = document.createElement('p');
			
			colorNode.className = 'color ' + this.getContrast(color.hex);
			colorNode.style.backgroundColor = '#' + color.hex;
			colorText.innerHTML = '#' + color.hex +
				'<br/>' + this.getDisplayRgb(color.rgb);
			colorNode.appendChild(colorText);
			
			domFragment.appendChild(colorNode);
		}.bind(this));
		
		this.clearBtn.style.display = 'block';
		savedColorsNode.style.display = 'block';
		savedColorsNode.style.width = width + 'px';
		savedColorsNode.innerHTML = '';
		savedColorsNode.appendChild(domFragment);
	
	}
	else {
		this.clearBtn.style.display = 'none';
		savedColorsNode.style.display = 'none';
	}
};

/**
 * Remove saved colors and clear local storage
 */
Converter.prototype.reset = function() {
	if (confirm('Are you sure you want to remove all saved colors?')) {
		event.preventDefault();
		this.savedColors = [];
		localStorage.clear();
		this.displaySavedColors();
	}
};

/**
 * Selects the contents of an input
 */
Converter.prototype.selectInput = function() {
	this.select();
};

/**
 * Get display HEX string
 * 
 * @param  hex  the hex string
 * @return  string  the string to display as the HEX value
 */

Converter.prototype.getDisplayHex = function(hex) {
	return '#' + hex;
};

/**
 * Get display RGB string
 * 
 * @param  rgb  an object of RGB values
 * @return  string  a string of comma seperated RGB values
 */
Converter.prototype.getDisplayRgb = function(rgb) {
	return [rgb.r, rgb.g, rgb.b].join(', ');
};

Converter.prototype.getContrast = function(hex) {
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	return (parseInt(hex, 16) > 0xffffff / 2) ? 'dark' : 'light';
};

/**
 * The main color constructor
 * 
 * A new color instance is created each time new input is entered into either
 * the HEX or RGB input fields. This instance is updated as changes are made.
 * The instance may also be passed to saveColor to save it to local storage.
 * 
 * @param  hex  the HEX value of the color
 * @param  rgb  the RGB value of the color
 */
function Color(hex, rgb) {
	this.hex = hex || '';
	this.rgb = rgb || {};
}

/**
 * Gets the RGB value from the HEX input and assigns it to the RGB property of
 * the color instance. Updates the RGB input field.
 */
Color.prototype.getRgbValue = function() {
	var pattern = /^([0-9a-f]{6})$/i;
	
	this.hex = converter.hexInput.value.replace(/\s|#/g, '');
	
	if (converter.settings.shorthand) {
		pattern = /^([0-9a-f]{3}|[0-9a-f]{6})$/i;
	}
	
	if (pattern.test(this.hex)) {
		this.valid = true;
		this.rgb = this.hexToRgb(this.hex);
	}
	else {
		this.valid = false;
		converter.rgbInput.value = '';
	}
	
	converter.updateApp(this, 'rgb');
};

/**
 * Convert a HEX value to RGB
 * 
 * @param  hex     a valid hex value (may be shorthand)
 * @return  object  an object containing red (r), green (g) and blue (b) values
 */
Color.prototype.hexToRgb = function(hex) {
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	
	return {
		r: parseInt(hex.slice(0, 2), 16),
		g: parseInt(hex.slice(2, 4), 16),
		b: parseInt(hex.slice(4, 6), 16)
	};
};

/**
 * Gets the HEX value from the RGB input and assigns it to the HEX property of
 * the color instance. Updates the HEX input field.
 */
Color.prototype.getHexValue = function() {
	var rgb, red, green, blue;
	
	rgb = converter.rgbInput.value.replace(/\s/g, '').split(',', 3);
	
	red   = parseInt(rgb[0], 10);
	green = parseInt(rgb[1], 10);
	blue  = parseInt(rgb[2], 10);
	
	if (this.checkValue(red) && this.checkValue(green) && this.checkValue(blue)) {
		this.valid = true;
		this.hex = this.rgbToHex(red, green, blue);
		this.rgb = {
			r: red,
			g: green,
			b: blue
		};
	}
	else {
		this.valid = false;
		converter.hexInput.value = '';
	}
	converter.updateApp(this, 'hex');
};

/**
 * Checks an RGB value to ensure it falls between 0 and 255
 * 
 * @param  n  the number to test
 * @return  bool  true if the value falls between 0 and 255, else false
 */
Color.prototype.checkValue = function(n) {
	var pattern = /^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/;
	return (pattern.test(n)) ? true : false;
};

/**
 * Convert an RGB value to HEX
 * 
 * Red, green and blue values must be valid (between 0 and 255).
 * 
 * @param  r  the red value
 * @param  g  the green value
 * @param  b  the blue value
 * @return  string  the HEX value as a string (without #)
 */
Color.prototype.rgbToHex = function(r, g, b) {
	var hr, hg, hb;
	
	hr = this.componentToHex(r);
	hg = this.componentToHex(g);
	hb = this.componentToHex(b);
	
	if (converter.settings.shorthand) {
		if (hr[0] === hr[1] && hg[0] === hg[1] && hb[0] === hb[1]) {
			hr = hr[0];
			hg = hg[0];
			hb = hb[0];
		}
	}
	
	return hr + hg + hb;
};

/**
 * Converts a single red, green or blue value to HEX
 * 
 * @param  color  the color value (must be between 0 and 255)
 * @return  string  the hex value
 */
Color.prototype.componentToHex = function(color) {
	var hex = color.toString(16);
	return hex.length === 1 ? '0' + hex : hex;
};

converter = new Converter();