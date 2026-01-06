package com.calltrack.calltrackapp.db.dao;

import com.calltrack.calltrackapp.db.bundles.TokenEntity;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

@Dao
public interface TokenDAO {
    @Insert
    void insert(TokenEntity token);
    @Query("SELECT * FROM token LIMIT 1")
    LiveData<TokenEntity> getToken();

    @Query("SELECT * FROM token LIMIT 1")
    TokenEntity getOne();
    @Query("DELETE FROM token")
    void deleteAll();
}
