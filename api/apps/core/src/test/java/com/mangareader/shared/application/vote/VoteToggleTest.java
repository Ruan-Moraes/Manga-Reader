package com.mangareader.shared.application.vote;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.shared.domain.vote.HasVoteCounters;
import com.mangareader.shared.domain.vote.VoteValue;

import lombok.Getter;
import lombok.Setter;

@DisplayName("VoteToggle")
class VoteToggleTest {

    @Getter
    @Setter
    private static class Votable implements HasVoteCounters {
        private long upvotes;
        private long downvotes;

        Votable(long up, long down) {
            this.upvotes = up;
            this.downvotes = down;
        }
    }

    /** Store que registra qual operação foi disparada. */
    private static class RecordingStore implements VoteToggle.VoteStore {
        final AtomicReference<String> op = new AtomicReference<>();

        @Override
        public void create(VoteValue value) {
            op.set("create:" + value);
        }

        @Override
        public void switchTo(VoteValue value) {
            op.set("switch:" + value);
        }

        @Override
        public void delete() {
            op.set("delete");
        }
    }

    @Test
    @DisplayName("Sem voto anterior: cria e incrementa o lado votado")
    void deveCriarVotoNovo() {
        var parent = new Votable(3, 1);
        var store = new RecordingStore();

        VoteValue result = VoteToggle.apply(parent, null, VoteValue.UP, store);

        assertThat(result).isEqualTo(VoteValue.UP);
        assertThat(parent.getUpvotes()).isEqualTo(4);
        assertThat(parent.getDownvotes()).isEqualTo(1);
        assertThat(store.op.get()).isEqualTo("create:UP");
    }

    @Test
    @DisplayName("Mesmo lado: remove (toggle off) e decrementa")
    void deveRemoverNoToggle() {
        var parent = new Votable(3, 1);
        var store = new RecordingStore();

        VoteValue result = VoteToggle.apply(parent, VoteValue.UP, VoteValue.UP, store);

        assertThat(result).isNull();
        assertThat(parent.getUpvotes()).isEqualTo(2);
        assertThat(store.op.get()).isEqualTo("delete");
    }

    @Test
    @DisplayName("Lado oposto: troca ajustando os dois contadores")
    void deveTrocarLado() {
        var parent = new Votable(3, 1);
        var store = new RecordingStore();

        VoteValue result = VoteToggle.apply(parent, VoteValue.UP, VoteValue.DOWN, store);

        assertThat(result).isEqualTo(VoteValue.DOWN);
        assertThat(parent.getUpvotes()).isEqualTo(2);
        assertThat(parent.getDownvotes()).isEqualTo(2);
        assertThat(store.op.get()).isEqualTo("switch:DOWN");
    }

    @Test
    @DisplayName("Contadores nunca ficam negativos (drift defensivo)")
    void naoDeveFicarNegativo() {
        var parent = new Votable(0, 0);

        VoteToggle.apply(parent, VoteValue.UP, VoteValue.UP, new RecordingStore());
        assertThat(parent.getUpvotes()).isZero();

        VoteToggle.undo(parent, VoteValue.DOWN);
        assertThat(parent.getDownvotes()).isZero();
    }

    @Test
    @DisplayName("undo decrementa apenas o lado removido")
    void undoDecrementaLadoRemovido() {
        var parent = new Votable(5, 2);

        VoteToggle.undo(parent, VoteValue.DOWN);

        assertThat(parent.getUpvotes()).isEqualTo(5);
        assertThat(parent.getDownvotes()).isEqualTo(1);
    }
}
