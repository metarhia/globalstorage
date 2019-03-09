'use strict';

const { addCategoryData } = require('./category');
const { getEntityPath, processFields } = require('./utils');
const validate = require('./validate');

const preprocessForm = form => {
  form.usedIn = [];
  return [];
};

const processForm = (form, ms) => {
  const category = ms.categories.get(form.category);
  if (!category) {
    return [];
  }
  return processFields(
    ms,
    category.definition,
    form.definition.Fields,
    `${getEntityPath(form)}.Fields`
  );
};

const validateForm = (ms, form, instance, options) =>
  validate(ms, form.definition.Fields, instance, options);

module.exports = {
  preprocessForm,
  processForm,
  addForm: addCategoryData.bind(null, 'form'),
  validateForm,
};
