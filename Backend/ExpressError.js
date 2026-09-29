class ExpressError extends Error{
    // Accepts both (status, message) and (message, status) — both orders are used in the controllers
    constructor(first, second){
        const [status, message] = typeof first === "number" ? [first, second] : [second, first];
        super(message);
        this.statusCode = status || 500;
    }
}

export default ExpressError;
