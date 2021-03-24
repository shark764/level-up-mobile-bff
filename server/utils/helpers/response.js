const success = (args) => {
    return {
        status: 'success',
        requestId: args.requestId,
        data: args.data || 'Operation successful'
    }
}

const error = (args) => {
    return {
        status: 'error',
        requestId: args.requestId,
        error: {
            code: args.code,
            message: args.message || 'Server Error'
        }
    }
}

module.exports = { success, error }
