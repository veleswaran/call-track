package com.calltrack.calltrackapp.db.bundles;

import java.util.List;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "token")
public class TokenEntity {
    @PrimaryKey(autoGenerate = true)
    public int id;
    public String token;

    public List<Integer> simSlots;

    public TokenEntity(String token, List<Integer> simSlots) {
        this.token = token;
        this.simSlots = simSlots;
    }
}
