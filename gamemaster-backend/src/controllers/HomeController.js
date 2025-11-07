export const home = (req, res) => {
    res.status(200).json({
        message: 'Bienvenue dans le monde du Rokugan !',
        status: 'success',
        timestamp: new Date().toISOString()
    });
};
//# sourceMappingURL=HomeController.js.map