'use strict';

const metatests = require('metatests');
global.api = { metatests };

require('./memory');
require('./mongodb');
require('./system');
