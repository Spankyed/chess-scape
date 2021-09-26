const { useHooks, logEvent, parseEvent, handleUnexpectedError } = require('lambda-hooks');
const Responses = require('../common/API_Responses');
const yup = require('yup');
// const { object, string, number } = require('yup');

// const { deserialize } = require('bson');

// const parseMessage = (state) => {
//     const { body } = state.event
//     let isBinary = Buffer.isBuffer(body)
//     let message = isBinary ? deserialize(body, {  promoteBuffers: true }) : JSON.parse(body)
//     if (!message) {
//         state.response = Responses._400({ error: 'No message found' })
//     }
//     if (isBinary && !isValidFileType(message.rawData)) {
//         state.response = Responses._400({ error: 'Invalid file type' })
//     }
//     state.event.message = message
//     return state
// }

const validateBody = async state => {
    const { bodySchema } = state.config;
    if (!bodySchema) {
        throw Error('missing the required body schema');
    }
    try {
        const { event } = state;
        await bodySchema.validate(event.body, { strict: true });
    } catch (error) {
        console.log('yup validation error of event.body', error);
        state.exit = true;
        state.response = Responses._400({ error: error.message  })
    }
    return state;
};

const validatePath = async state => {
    const { pathSchema } = state.config;
    if (!pathSchema) {
        throw Error('missing the required path schema');
    }
    try {
        const { event } = state;
        await pathSchema.validate(event.pathParameters, { strict: true });
    } catch (error) {
        console.log('yup validation error of path parameters', error);
        state.exit = true;
        state.response = Responses._400({ error: error.message  })
    }
    return state;
};

const hookHandlers = {
    log: logEvent,
    parse: parseEvent,
    // parseMessage,
    validateBody, validatePath
}

const withHooks = (hooks, config) => useHooks({
    before: hooks.map(hook => hookHandlers[hook]),
    after: [],
    onError: [ handleUnexpectedError ],
}, config)

const hooksWithSchema = (models, hooks) => {
    const { modelNames, ...schemas } = schemasFromModels(models)
    return withHooks([...hooks, ...getValidatorHooks(modelNames)], schemas)
};

module.exports = {
    withHooks,
    hooksWithSchema
};

const getValidatorHooks = modelNames => modelNames.map(name => {
    return 'validate' + name.charAt(0).toUpperCase() + name.slice(1);
})

const schemasFromModels = models => Object.entries(models).reduce((schemas, [name, model]) => {
    let shape = Object.entries(model).reduce((fields, [field, type]) => (
        { ...fields, [field]: yup[type]().required()}
    ), {})
    return {
        ...schemas,
        modelNames: [...schemas.modelNames, name],
        [name + 'Schema']: yup.object().shape(shape),
    }
}, {modelNames:[]})

