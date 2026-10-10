# /gen-api-endpoint

Scaffolds a new API endpoint following all project conventions.

## Usage
```
/gen-api-endpoint [method] [resource] [action]
Example: /gen-api-endpoint POST projects create
Example: /gen-api-endpoint GET projects/:id/milestones list
```

## Steps
1. Load skill: tenant-context
2. Load skill: api-versioning
3. Load skill: audit-log
4. Read Platform_API_Spec_v1_0.docx Section 1 for standards
5. Read Platform_Roles_Permissions_v1_0.docx for permission matrix

6. Generate route handler with:
   ```typescript
   // Route: [METHOD] /v1/[resource]
   fastify.route({
     method: '[METHOD]',
     url: '/v1/[resource]',
     preHandler: [validateJWT, validateUserAgent, requireRole('[ROLE]')],
     handler: async (request, reply) => {
       const { tenantId, userId, role } = request.user;
       
       return await withTenantContext(tenantId, async (prisma) => {
         // business logic here
         
         // audit log on mutations
         await auditLog.write({ ... });
         
         return reply.send({ data: result });
       });
     }
   });
   ```

7. Apply correct role guard from permission matrix

8. Add audit log call for any CREATE, UPDATE, or DELETE operation

9. Use standard error format:
   ```json
   { "error": { "code": "RESOURCE_NOT_FOUND", "message": "Project not found" } }
   ```

10. Add to API route index file

## Output checklist
- [ ] Route file created under /api/routes/v1/
- [ ] JWT middleware applied
- [ ] User-Agent validation applied
- [ ] Role guard matches permission matrix
- [ ] withTenantContext wraps all DB calls
- [ ] Audit log called on mutations
- [ ] Standard error format used
- [ ] Route registered in index
