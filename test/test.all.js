'use strict';

const metatests = require('metatests');
global.api = { metatests };

require('./memory');
require('./system');
api.metatests.report();
