"use strict";
// Script de test universel pour toutes les routes de l’API
// Génère un rapport structuré dans docs/test_all_routes.md
// Pour chaque endpoint détecté, effectue un appel adapté et logue le résultat
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Dépendances : node-fetch (ou fetch natif Node 18+), fs
var promises_1 = __importDefault(require("fs/promises"));
var fetch = globalThis.fetch || (await Promise.resolve().then(function () { return __importStar(require('node-fetch')); })).default;
// Liste des routes GET publiques à tester (paramètres fictifs pour les tests)
var GET_ROUTES = [
    { path: '/api/rooms', label: 'Liste des rooms' },
    { path: '/api/rooms/stats', label: 'Stats rooms' },
    { path: '/api/rooms/gm/1', label: 'Rooms par GM (id=1)' },
    { path: '/api/rooms/player/1', label: 'Rooms par joueur (id=1)' },
    { path: '/api/rooms/1', label: 'Room par id (id=1)' },
    { path: '/api/scenarios', label: 'Liste des scénarios' },
    { path: '/api/scenarios/1', label: 'Scénario par id (id=1)' },
    { path: '/api/reference/skills', label: 'Compétences' },
    { path: '/api/reference/clans/1', label: 'Clan par id (id=1)' },
    { path: '/api/reference/schools/1', label: 'École par id (id=1)' },
    { path: '/api/reference/disadvantages/1', label: 'Désavantage par id (id=1)' },
    { path: '/api/reference/equipment', label: 'Équipement' },
    { path: '/api/reference/equipment/weapons', label: 'Armes' },
    { path: '/api/reference/equipment/armor', label: 'Armures' },
    { path: '/api/reference/equipment/items', label: 'Objets' },
    { path: '/api/reference/equipement', label: 'Équipement (FR)' },
    { path: '/api/reference/spells', label: 'Sorts (filtrable)' },
    { path: '/api/reference/spells/element/terre', label: 'Sorts par élément (terre)' },
    { path: '/api/reference/spells/mastery/1', label: 'Sorts par rang (1)' },
    { path: '/api/reference/sorts', label: 'Sorts (alias FR)' },
    { path: '/api/reference/sorts/element/terre', label: 'Sorts (FR) par élément' },
    { path: '/api/reference/sorts/rang/1', label: 'Sorts (FR) par rang' },
    { path: '/api/reference/kiho', label: 'Kiho' },
    { path: '/api/frontend/clans', label: 'Clans (frontend)' },
    { path: '/api/frontend/schools', label: 'Écoles (frontend)' },
    { path: '/api/frontend/advantages', label: 'Avantages (frontend)' },
    { path: '/api/frontend/disadvantages', label: 'Désavantages (frontend)' },
    { path: '/api/frontend/spells', label: 'Sorts (frontend)' },
    { path: '/api/frontend/maho', label: 'Maho (frontend)' },
    { path: '/api/frontend/kiho', label: 'Kiho (frontend)' },
    { path: '/api/frontend/equipment', label: 'Équipement (frontend)' },
    { path: '/api/frontend/techniques', label: 'Techniques (frontend)' },
    { path: '/api/frontend/kata', label: 'Kata (frontend)' },
    { path: '/api/frontend/all', label: 'Bundle complet (frontend)' },
    { path: '/api/health', label: 'Health check' },
    { path: '/api/stats', label: 'Stats serveur' },
];
var BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
var REPORT_PATH = 'docs/test_all_routes.md';
function formatResult(_a) {
    var route = _a.route, label = _a.label, status = _a.status, duration = _a.duration, ok = _a.ok, json = _a.json, error = _a.error;
    return [
        "## ".concat(label, " `").concat(route, "`"),
        "- **Code HTTP** : ".concat(status),
        "- **Dur\u00E9e** : ".concat(duration, " ms"),
        "- **Succ\u00E8s** : ".concat(ok ? '✅' : '❌'),
        error ? "- **Erreur** : ".concat(error) : '',
        json ? "- **Extrait r\u00E9ponse** : `\n".concat(JSON.stringify(json, null, 2).slice(0, 400), "`") : '',
        ''
    ].join('\n');
}
function testAllGetRoutes() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, GET_ROUTES_1, _a, path, label, url, start, status_1, ok, json, error, res, _b, e_1, duration;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    _i = 0, GET_ROUTES_1 = GET_ROUTES;
                    _c.label = 1;
                case 1:
                    if (!(_i < GET_ROUTES_1.length)) return [3 /*break*/, 11];
                    _a = GET_ROUTES_1[_i], path = _a.path, label = _a.label;
                    url = BASE_URL + path;
                    start = Date.now();
                    status_1 = 0, ok = false, json = null, error = '';
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, fetch(url)];
                case 3:
                    res = _c.sent();
                    status_1 = res.status;
                    ok = res.ok;
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, res.json()];
                case 5:
                    json = _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _b = _c.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_1 = _c.sent();
                    error = String(e_1);
                    return [3 /*break*/, 9];
                case 9:
                    duration = Date.now() - start;
                    results.push({ route: path, label: label, status: status_1, duration: duration, ok: ok, json: json, error: error });
                    console.log("[".concat(status_1, "] ").concat(path, " (").concat(duration, "ms) ").concat(ok ? 'OK' : 'FAIL'));
                    _c.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/, results];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var date, results, md, _i, results_1, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    date = new Date().toLocaleString('fr-FR');
                    return [4 /*yield*/, testAllGetRoutes()];
                case 1:
                    results = _a.sent();
                    md = "# Rapport de test automatis\u00E9 : toutes les routes\n\n**Date d\u2019ex\u00E9cution :** ".concat(date, "\n\n");
                    md += '\n---\n';
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        r = results_1[_i];
                        md += '\n' + formatResult(r) + '\n';
                    }
                    return [4 /*yield*/, promises_1.default.writeFile(REPORT_PATH, md, 'utf-8')];
                case 2:
                    _a.sent();
                    console.log("\nRapport g\u00E9n\u00E9r\u00E9 dans ".concat(REPORT_PATH));
                    return [2 /*return*/];
            }
        });
    });
}
main();
