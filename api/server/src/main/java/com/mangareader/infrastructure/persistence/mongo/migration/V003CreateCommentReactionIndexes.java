package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V003-create-comment-reaction-indexes", order = "003", author = "mangareader")
public class V003CreateCommentReactionIndexes {
    private final MongoTemplate mongoTemplate;

    public V003CreateCommentReactionIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var ops = mongoTemplate.indexOps("comment_reactions");

        ops.ensureIndex(new Index().on("commentId", Sort.Direction.ASC).named("idx_comment_reactions_commentId"));
        ops.ensureIndex(new Index().on("userId", Sort.Direction.ASC).named("idx_comment_reactions_userId"));

        var compoundDef = new org.bson.Document();
        compoundDef.put("commentId", 1);
        compoundDef.put("userId", 1);

        ops.ensureIndex(new CompoundIndexDefinition(compoundDef)
                .unique()
                .named("idx_comment_reaction_comment_user"));
    }

    @RollbackExecution
    public void rollback() {
        var ops = mongoTemplate.indexOps("comment_reactions");

        ops.getIndexInfo().stream()
                .filter(idx -> !idx.getName().equals("_id_"))
                .forEach(idx -> ops.dropIndex(idx.getName()));
    }
}
