'use strict';

const { iter } = require('@metarhia/common');

const {
  errors: { SchemaValidationError },
} = require('metaschema');

const { addCategoryData } = require('./category');
const { getEntityPath, processFields } = require('./utils');
const validate = require('./validate');

const processAction = (action, ms) => {
  const errors = [];
  const def = action.definition;

  const category = ms.categories.get(action.category);
  if (!category) {
    return [];
  }

  errors.push(
    ...processFields(
      ms,
      category.definition,
      def.Args,
      `${getEntityPath(action)}.Args`
    )
  );
  errors.push(
    ...processFields(
      ms,
      category.definition,
      def.Returns,
      `${getEntityPath(action)}.Returns`
    )
  );

  const formName = def.Form || action.name;
  const form = category.forms.get(formName);

  if (form) {
    iter(Object.keys(def.Args))
      .filter(arg => !!form.definition.Fields[arg])
      .each(arg =>
        errors.push(
          new SchemaValidationError(
            'duplicate',
            `${getEntityPath(action)}.Args`,
            {
              type: 'property',
              value: arg,
            }
          )
        )
      );

    action.form = form.definition;
  }

  return errors;
};

const validateAction = (ms, action, instance, options) =>
  validate(ms, action.definition.Params, instance, options);

module.exports = {
  processAction,
  addAction: addCategoryData.bind(null, 'action'),
  validateAction,
};
