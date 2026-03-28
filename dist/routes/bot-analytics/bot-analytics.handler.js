import { addWhitelistEntry, getApiKeyMetrics, getApiKeyRule, getDetectionLogs, getGeoDistribution, getOverviewKpis, getProjectApiKeysWithRules, removeWhitelistEntry, upsertApiKeyRules } from "../../services/bot-analytics.service.js";
// GET /api/v1/bot-management/overview?projectId=xxx&range.7d
export const getBotOverview = async (request, reply) => {
    const { projectId, range = "7d" } = request.query;
    try {
        if (!projectId)
            return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
        const data = await getOverviewKpis(projectId, range);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// GET /api/v1/bot-management/detections?projectId=xxx&page=1&limit=50&search=&action=
export const getBotDetections = async (request, reply) => {
    const { projectId, page = "1", limit = "50", search = "", action = "" } = request.query;
    try {
        if (!projectId)
            return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
        const data = await getDetectionLogs(projectId, parseInt(page), parseInt(limit), search, action);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// GET /api/v1/bot-management/rules?projectId.xxx
export const getProjectRules = async (request, reply) => {
    const { projectId } = request.query;
    try {
        if (!projectId)
            return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
        const data = await getProjectApiKeysWithRules(projectId);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// GET /api/v1/bot-management/rules/:keyId.
export const getSingleKeyRule = async (request, reply) => {
    const { keyId } = request.params;
    try {
        const data = await getApiKeyRule(keyId);
        if (!data)
            return reply.code(404).send({ status: "Not Found", message: "No rule found for this key" });
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// PATCH /api/v1/bot-management/rules
// Body: { keyIds: string[], rules: { strictness, persistence, signals, whitelist } }
export const updateKeyRules = async (request, reply) => {
    const { keyIds, rules } = request.body;
    try {
        if (!keyIds?.length)
            return reply.code(400).send({ status: "Bad Request", message: "keyIds array is required" });
        const data = await upsertApiKeyRules(keyIds, rules);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// GET /api/v1/bot-management/keys/:keyId/metrics?range=7d
export const getApiKeyMetricsHandler = async (request, reply) => {
    const { keyId } = request.params;
    const { range = "7d" } = request.query;
    try {
        const data = await getApiKeyMetrics(keyId, range);
        if (!data)
            return reply.code(404).send({ status: "Not Found", message: "API key not found" });
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// GET /api/v1/bot-management/geo?projectId=xxx&range=7d
export const getGeoDistributionHandler = async (request, reply) => {
    const { projectId, range = "7d" } = request.query;
    try {
        if (!projectId)
            return reply.code(400).send({ status: "Bad Request", message: "projectId is required" });
        const data = await getGeoDistribution(projectId, range);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// ── GET /api/v1/bot-management/rules?projectId ─────────────────────
export const getProjectRulesHandler = async (request, reply) => {
    const { projectId } = request.query;
    if (!projectId) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "projectId is required",
        });
    }
    try {
        const data = await getProjectApiKeysWithRules(projectId);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        request.log.error(error, "getProjectRulesHandler failed");
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// ── GET /api/v1/bot-management/rules/:keyId ────────────────────────
export const getApiKeyRuleHandler = async (request, reply) => {
    const { keyId } = request.params;
    try {
        const data = await getApiKeyRule(keyId);
        if (!data) {
            return reply.code(404).send({ status: "Not Found", message: "No rule found for this key" });
        }
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        request.log.error(error, "getApiKeyRuleHandler failed");
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// ── PATCH /api/v1/bot-management/rules ────────────────────────────
// Body: { keyIds: string[], rules: RulePayload }
export const upsertApiKeyRulesHandler = async (request, reply) => {
    const { keyIds, rules } = request.body;
    if (!keyIds?.length) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "keyIds array is required",
        });
    }
    if (!rules) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "rules payload is required",
        });
    }
    try {
        const data = await upsertApiKeyRules(keyIds, rules);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        request.log.error(error, "upsertApiKeyRulesHandler failed");
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// ── POST /api/v1/bot-management/whitelist ─────────────────────────
// Body: { keyIds: string[], entry: WhitelistEntry }
export const addWhitelistEntryHandler = async (request, reply) => {
    const { keyIds, entry } = request.body;
    if (!keyIds?.length) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "keyIds array is required",
        });
    }
    if (!entry?.name || !entry?.value) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "entry.name and entry.value are required",
        });
    }
    try {
        const data = await addWhitelistEntry(keyIds, entry);
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        request.log.error(error, "addWhitelistEntryHandler failed");
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
// ── DELETE /api/v1/bot-management/whitelist ───────────────────────
// Body: { keyId: string, entryValue: string }
export const removeWhitelistEntryHandler = async (request, reply) => {
    const { keyId, entryValue } = request.body;
    if (!keyId || !entryValue) {
        return reply.code(400).send({
            status: "Bad Request",
            message: "keyId and entryValue are required",
        });
    }
    try {
        const data = await removeWhitelistEntry(keyId, entryValue);
        if (!data) {
            return reply.code(404).send({
                status: "Not Found",
                message: "Rule not found for this key",
            });
        }
        return reply.code(200).send({ status: "success", data });
    }
    catch (error) {
        request.log.error(error, "removeWhitelistEntryHandler failed");
        return reply.code(500).send({ status: "Internal Server Error", error });
    }
};
