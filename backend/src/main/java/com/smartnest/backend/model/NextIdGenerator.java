package com.smartnest.backend.model;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.hibernate.persister.entity.EntityPersister;
import org.hibernate.query.QueryFlushMode;

import java.util.HashMap;
import java.util.Map;

/**
 * The tables use plain INT primary keys (no IDENTITY), so the backend picks the ID:
 * new ID = biggest ID already in the table + 1.
 */
public class NextIdGenerator implements IdentifierGenerator {

    // Last ID given out for each table, so two rows saved in the same transaction don't get the same number.
    private static final Map<String, Long> lastIds = new HashMap<>();

    @Override
    public Object generate(SharedSessionContractImplementor session, Object entity) {
        EntityPersister persister = session.getEntityPersister(null, entity);
        String entityName = persister.getRootEntityName();

        Long maxId = session.createSelectionQuery(
                        "select max(e." + persister.getIdentifierPropertyName() + ") from " + entityName + " e",
                        Long.class)
                .setQueryFlushMode(QueryFlushMode.NO_FLUSH)
                .getSingleResultOrNull();
        long maxInTable = maxId == null ? 0 : maxId;

        synchronized (lastIds) {
            long nextId = Math.max(maxInTable, lastIds.getOrDefault(entityName, 0L)) + 1;
            lastIds.put(entityName, nextId);
            return nextId;
        }
    }
}
