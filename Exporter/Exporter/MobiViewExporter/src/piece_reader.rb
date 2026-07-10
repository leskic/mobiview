# encoding: UTF-8

module MobiViewExporter

  module PieceReader

    extend self

    ############################################################
    # LEITURA PRINCIPAL
    ############################################################

    def read(entity,index,world_transform = nil)

      tr = world_transform || entity.transformation

      local_center = entity.definition.bounds.center
      world_center = tr * local_center

      geometry = GeometryAnalyzer.analyze(entity, tr)

      dinabox = DinaboxParser.parse(entity)

      {

        ########################################################
        # IDENTIFICAÇÃO
        ########################################################

        mv_uuid: Utils.build_uuid(index),

        persistent_id: entity.persistent_id,

        code: Utils.piece_code(entity),

        name: Utils.piece_name(entity),

        module_id: Utils.module_id(entity),

        material: Utils.material(entity),

        ########################################################
        # GEOMETRIA
        ########################################################

        geometry: geometry,

        ########################################################
        # TRANSFORMAÇÃO
        ########################################################

        transform:{

          origin:{

            x:tr.origin.x.to_mm.round(2),

            y:tr.origin.y.to_mm.round(2),

            z:tr.origin.z.to_mm.round(2)

          },

          center:{

            x:world_center.x.to_mm.round(2),

            y:world_center.y.to_mm.round(2),

            z:world_center.z.to_mm.round(2)

          },

          x_axis:axis(tr.xaxis),

          y_axis:axis(tr.yaxis),

          z_axis:axis(tr.zaxis)

        },

        ########################################################
        # SKETCHUP
        ########################################################

        sketchup:{

          definition:entity.definition.name,

          layer:entity.layer.name,

          hidden:entity.hidden?,

          locked:entity.locked?,

          guid:entity.definition.guid

        },

        ########################################################
        # DINABOX
        ########################################################

        dinabox:dinabox,

        ########################################################
        # ATRIBUTOS
        ########################################################

        dynamic_attributes:dynamic_attributes(entity)

      }

    end

    ############################################################
    # EIXO
    ############################################################

    def axis(vector)

      {

        x:vector.x.round(6),

        y:vector.y.round(6),

        z:vector.z.round(6)

      }

    end

    ############################################################
    # ATRIBUTOS
    ############################################################

    def dynamic_attributes(entity)

      attrs = {}

      dict = Utils.dynamic_attributes(entity)

      return attrs unless dict

      dict.each_pair do |key,value|

        attrs[key] = value

      end

      attrs

    end

  end

end
