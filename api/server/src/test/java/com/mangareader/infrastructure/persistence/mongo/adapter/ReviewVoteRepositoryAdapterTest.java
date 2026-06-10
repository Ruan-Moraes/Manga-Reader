package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.domain.review.entity.ReviewVote;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.infrastructure.persistence.mongo.repository.ReviewVoteMongoRepository;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("ReviewVoteRepositoryAdapter")
@Tag("testcontainers")
class ReviewVoteRepositoryAdapterTest {
    @Autowired
    private ReviewVoteMongoRepository mongoRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private ReviewVoteRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(ReviewVote.class);
        adapter = new ReviewVoteRepositoryAdapter(mongoRepository);
    }

    private ReviewVote vote(String ratingId, String userId, VoteValue value) {
        return adapter.save(ReviewVote.builder().ratingId(ratingId).userId(userId).value(value).build());
    }

    @Test
    @DisplayName("Deve salvar e encontrar voto por ratingId + userId")
    void deveSalvarEEncontrar() {
        vote("r1", "u1", VoteValue.UP);

        var found = adapter.findByRatingIdAndUserId("r1", "u1");

        assertThat(found).isPresent();
        assertThat(found.get().getValue()).isEqualTo(VoteValue.UP);
        assertThat(found.get().getId()).isNotNull();
    }

    @Test
    @DisplayName("Deve retornar vazio quando o usuário não votou")
    void deveRetornarVazio() {
        assertThat(adapter.findByRatingIdAndUserId("r1", "u-sem-voto")).isEmpty();
    }

    @Test
    @DisplayName("Deve resolver votos de várias resenhas para um usuário (myVote em lote)")
    void deveResolverEmLote() {
        vote("r1", "u1", VoteValue.UP);
        vote("r2", "u1", VoteValue.DOWN);
        vote("r3", "u2", VoteValue.UP);

        List<ReviewVote> votes = adapter.findByRatingIdInAndUserId(List.of("r1", "r2", "r3"), "u1");

        assertThat(votes).hasSize(2);
        assertThat(votes).extracting(ReviewVote::getRatingId).containsExactlyInAnyOrder("r1", "r2");
    }

    @Test
    @DisplayName("Deve remover o voto")
    void deveRemover() {
        ReviewVote saved = vote("r1", "u1", VoteValue.UP);

        adapter.delete(saved);

        assertThat(adapter.findByRatingIdAndUserId("r1", "u1")).isEmpty();
    }
}
