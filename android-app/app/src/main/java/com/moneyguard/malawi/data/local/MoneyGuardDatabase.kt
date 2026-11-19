package com.moneyguard.malawi.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [DetectionEntity::class],
    version = 2,
    exportSchema = false
)
abstract class MoneyGuardDatabase : RoomDatabase() {
    abstract fun detectionDao(): DetectionDao

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE detections ADD COLUMN fingerprint TEXT NOT NULL DEFAULT ''"
                )
                db.execSQL(
                    "CREATE INDEX IF NOT EXISTS index_detections_fingerprint " +
                        "ON detections(fingerprint)"
                )
            }
        }

        @Volatile
        private var instance: MoneyGuardDatabase? = null

        fun getInstance(context: Context): MoneyGuardDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MoneyGuardDatabase::class.java,
                    "moneyguard-detections.db"
                ).addMigrations(MIGRATION_1_2).build().also { instance = it }
            }
    }
}
